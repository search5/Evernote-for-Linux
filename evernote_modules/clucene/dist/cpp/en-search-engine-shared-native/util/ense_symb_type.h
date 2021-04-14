#ifndef _ense_symb_type_
#define _ense_symb_type_

namespace evernote {
namespace cosm {
namespace util {
namespace token {

class CSymbTypes
{
protected:
  CSymbTypes(){}
  ~CSymbTypes(){}

public:
  static bool IsItPunct(wchar_t wch);
  static bool IsItSpace(wchar_t wch);

  static wchar_t toUpper(wchar_t wch);
  static wchar_t toLower(wchar_t wch);

  static bool isUpper(wchar_t wch) { return (toLower(wch) != wch); }
	static bool isLower(wchar_t wch) { return (toUpper(wch) != wch); }
};

}
}
}
}

#endif