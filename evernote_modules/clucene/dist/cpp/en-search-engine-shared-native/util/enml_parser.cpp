#include <set>
#include <vector>
#include <string>

#include "enml_parser.h"

// retrieve result
void EnmlToTextVisitor::cleanSpacesAndGetText(std::string & sText)
{
	postProcessSpaces();
	sText = sText_;
}

// replace sequences of spaces with single space (or newline, if there was a new line)
void cleanUpSpaces(const std::string & sText, std::string & sResult)
{
	sResult.clear();

	const std::string sSpaceChar = " \t\r\f";
	const char cNewLine = '\n';
	const char cSpace = ' ';
	bool bInSpaceSeq = false; // are we inside of space sequence
	bool bNewLine = false; // there was a new line in a space sequence
	for (size_t nPos = sText.find_first_not_of(sSpaceChar + cNewLine); nPos < sText.size(); ++nPos)
	{
		const char cCurrChar = sText[nPos];
		bool bIsNewLine = (cNewLine == cCurrChar); // current char is newline
		bool bIsSpace = bIsNewLine; // current char is space char (including newline)
		if(!bIsNewLine)
			bIsSpace = (sSpaceChar.find(cCurrChar) != std::string::npos);

		if (bIsNewLine)
			bNewLine = true;

		if (!bIsSpace && !bInSpaceSeq) // non space char
		{
			sResult.push_back(cCurrChar);
		}
		else if (nPos == sText.size() - 1) // last character
		{
			if (bNewLine)
			{
				sResult.push_back(cNewLine);
			}
			else
			{
				sResult.push_back(cSpace);
			}
		}
		else if (!bIsSpace && bInSpaceSeq) // end of space sequence
		{
			if (bNewLine)
			{
				sResult.push_back(cNewLine);
			}
			else
			{
				sResult.push_back(cSpace);
			}
			sResult.push_back(cCurrChar);
			bNewLine = false;
			bInSpaceSeq = false;
		}
		else if (bIsSpace && !bInSpaceSeq) // start of space sequence
		{
			bInSpaceSeq = true;
		}
		// else if space char in space sequence -- do nothing
	}
}

// clear extra spaces and newlines
void EnmlToTextVisitor::postProcessSpaces()
{
	std::string sResult;
	cleanUpSpaces(sText_, sResult);
	sText_ = sResult;
}

bool EnmlToTextVisitor::VisitEnter(const tinyxml2::XMLElement & element, const tinyxml2::XMLAttribute * firstAttribute)
{
	// check for skip tags
	if (setTagsSkip_.find(element.Value()) != setTagsSkip_.end())
	{
		return false; // skip all tree brunches inside
	}

	// add newline
	if (setTagsNewLineBefore_.find(element.Value()) != setTagsNewLineBefore_.end())
	{
		if (!bNewLine_)
		{
			sText_ += "\n";
			bNewLine_ = true;
		}
	}

	return true;
}

bool EnmlToTextVisitor::VisitExit(const tinyxml2::XMLElement & element)
{
	// add newline
	if (setTagsNewLineAfter_.find(element.Value()) != setTagsNewLineAfter_.end())
	{
		if (!bNewLine_)
		{
			sText_ += "\n";
			bNewLine_ = true;
		}
	}

	return true;
}

bool EnmlToTextVisitor::Visit(const tinyxml2::XMLText & text)
{
	std::string sRawText = text.Value();
	if (sRawText.size() == 0)
		return true;

	// remove special html symbols
	size_t nPos = sRawText.find('&');
	while (nPos < sRawText.size())
	{
		for (const auto & repl : vSpecialSymbReplace_)
		{
			if (sRawText.compare(nPos, repl.first.size(), repl.first) == 0)
			{
				sRawText.replace(nPos, repl.first.size(), repl.second);
				nPos += repl.second.size();
				break;
			}
		}
		nPos = sRawText.find('&', nPos + 1);
	}

	sText_ += sRawText;
	bNewLine_ = (sText_.back() == '\n');

	return true;
}

// first enter to the document
bool EnmlToTextVisitor::VisitEnter(const tinyxml2::XMLDocument & doc)
{
	bNewLine_ = true;
	sText_.clear();
	return true;
}

bool EnmlToTextVisitor::VisitExit(const tinyxml2::XMLDocument & doc)
{
	return true;
}

// class TINYXML2_LIB WordCounter : public tinyxml2::XMLVisitor
// {
// public:
// 	int nWords_ = 0; // words in text (not tags)

// public:
// 	virtual ~WordCounter() {}

// 	/// Visit a text node.
// 	virtual bool Visit(const tinyxml2::XMLText& text);

// };

// bool WordCounter::Visit(const tinyxml2::XMLText & text)
// {
// 	nWords_ += splitter::countWordsAlphanum(text.Value());
// 	return true;
// }

// struct TableTemplateInfo
// {
// 	std::string templateName;
// 	std::string keyword1;
// 	std::string keyword2;

// 	TableTemplateInfo() {};
// 	TableTemplateInfo(std::string templateName, std::string keyword1, std::string keyword2) :
// 		templateName(templateName), keyword1(keyword1), keyword2(keyword2) {};
// };

// Parse enml with help of xml parser
// Byproduct of this call is xml parse tree
bool enmlToPlainText(const std::string & sEnml, tinyxml2::XMLDocument & enml, std::string & sText)
{
	enml.Clear();
	sText.clear();

	// check if we have plain text already
	if (sEnml.find('<') == std::string::npos)
	{
		cleanUpSpaces(sEnml, sText);
		return true;
	}

	auto xml_error = enml.Parse(sEnml.c_str());
	if (xml_error != tinyxml2::XML_NO_ERROR || !enml.FirstChild()) // parse failed
	{
		
		return false;
	}

	EnmlToTextVisitor visitor;
	enml.Accept(&visitor);
	visitor.cleanSpacesAndGetText(sText);

    return true;
}

// same as previous, but without passing xml parse tree outside
bool enmlToPlainText(const std::string & sEnml, std::string & sText)
{
	tinyxml2::XMLDocument enml;
	return enmlToPlainText(sEnml, enml, sText);
}
