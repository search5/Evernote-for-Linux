#include <iostream>
#include <memory>
#include "tinyxml2.h"

#include "ense_utils.h"
#include "ense_reco_resource_parser.h"

namespace resource {
    RecognitionDataParser::RecognitionDataParser(const std::string& utf8_xml_recognition_data): kRecoIndexField("recoIndex"), kItemField("item"), kTField("t"), utf8_xml_recognition_data_(utf8_xml_recognition_data)
    {}

    std::string RecognitionDataParser::get_recognition_text() {
        std::string recognition_text;

        auto xml_doc = std::make_unique<tinyxml2::XMLDocument>();
        auto status = xml_doc->Parse(utf8_xml_recognition_data_.c_str());
        if (status != tinyxml2::XMLError::XML_SUCCESS) {
            return recognition_text;
        }

        auto root = xml_doc->FirstChildElement(kRecoIndexField.c_str());
        if (root == nullptr) {
            return recognition_text;
        }

        for (auto child = root->FirstChildElement(); child != nullptr; child = child->NextSiblingElement())
        {
            auto top = child->FirstChildElement();
            if (top == nullptr) {
                continue;
            }

            auto text = top->GetText();
            if (text == nullptr) {
                continue;
            }
            recognition_text += text;
            recognition_text += " ";
        }

        return recognition_text;
    }

    std::pair<std::string, std::string> get_recognition_text(const std::string& hex_buffer)
    {
        std::string error;
        std::string recognition_text;
        try {
            auto decoded_buffer = util::hex_decode(hex_buffer);
            auto parser = std::make_unique<resource::RecognitionDataParser>(decoded_buffer);
            recognition_text = parser->get_recognition_text();
        } catch (std::exception& exception) {
            error = util::format_exception("get_recognition_text", "std::exception", "masked exception");
        } catch(...) {
            error = util::format_exception("get_recognition_text", "unknown exception", "unknown");
        }

        return std::make_pair(error, recognition_text);
    }
}