#ifndef _ense_reco_resource_parser_
#define _ense_reco_resource_parser_

#include <string>
#include <utility>

namespace resource {
    class RecognitionDataParser {
        public:
            RecognitionDataParser(const std::string& utf8_xml_recognition_data);
        public:
            std::string get_recognition_text();
        private:
            const std::string kRecoIndexField;
            const std::string kItemField;
            const std::string kTField;
        private:
            std::string utf8_xml_recognition_data_;
    };

    std::pair<std::string, std::string> get_recognition_text(const std::string& utf8_xml_recognition_data);
}

#endif
