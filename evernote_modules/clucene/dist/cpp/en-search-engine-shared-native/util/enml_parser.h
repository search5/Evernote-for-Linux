#ifndef _enml_parser_
#define _enml_parser_

#include <regex>
#include <set>
#include <string>
#include <vector>

#include "tinyxml2.h"

bool enmlToPlainText(const std::string & sEnml, tinyxml2::XMLDocument & enml, std::string & sText);
bool enmlToPlainText(const std::string & sEnml, std::string & sText);

// xml visitor which creates text from enml
// Adds newlines after specific tags, skips tags, replaces some escape sequences
class TINYXML2_LIB EnmlToTextVisitor : public tinyxml2::XMLVisitor
{
	std::string sText_; // resulting plain text
	const std::set<std::string> setTagsNewLineBefore_ = { "br", "p", "div", "table", "tr", "td", "pre", "form", "section", "li", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "dl", "dt", "db"}; // insert newline before these tags
	const std::set<std::string> setTagsNewLineAfter_ = {"p", "div", "table", "tr", "td", "pre", "form", "section", "li", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "dl", "dt", "db" }; // insert newline after these tags
	const std::set<std::string> setTagsSkip_ = { "en-crypt" }; // skip contents of these tags (including all inner text, tags, etc)
	const std::vector<std::pair<std::string, std::string>> vSpecialSymbReplace_ = { {"&gt;", ">"}, { "&lt;", "<" }, { "&quot;", "\"" }, { "&apos;", "'" }, { "&amp;", "&" }, { "&nbsp;", " " } };
	bool bNewLine_ = true; // there was a new line

public:
	virtual ~EnmlToTextVisitor() {}
	void cleanSpacesAndGetText(std::string & sText);
	void postProcessSpaces();

public:
	/// Visit an element.
	virtual bool VisitEnter(const tinyxml2::XMLElement& element, const tinyxml2::XMLAttribute* firstAttribute);
	/// Visit an element.
	virtual bool VisitExit(const tinyxml2::XMLElement& element);
	/// Visit a text node.
	virtual bool Visit(const tinyxml2::XMLText& text);
	/// Visit a document.
	virtual bool VisitEnter(const tinyxml2::XMLDocument& doc);
	/// Visit a document.
	virtual bool VisitExit(const tinyxml2::XMLDocument& doc);
};

#endif