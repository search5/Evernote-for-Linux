#include "ense_symb_type.h"

#include <wchar.h>
#include "ense_symb_type_uplo.h"

namespace evernote {
namespace cosm {
namespace util {
namespace token {

  bool CSymbTypes::IsItPunct(wchar_t wch)
  {
    bool bRet = false;

    if (wch < 256)
    {
      static wchar_t aPunct[] =  {0x0021, 0x0022, 0x0027, 0x0028, 0x0029, 0x002A, 0x002B, 0x002C, 0x002D, 0x002E, 0x002F,
                                    0x003A, 0x003B, 0x003C, 0x003D, 0x003E, 0x003F,
                                    0x005B, 0x005C, 0x005D, 0x005E, 0x005F, 0x0060,
                                    0x007B, 0x007C, 0x007D, 0x007E,
                                    0x0082, 0x0084, 0x0085, 0x008B,
                                    0x0091, 0x0092, 0x0093, 0x0094, 0x0095, 0x0096, 0x0097, 0x009B,
                                    0x00A1, 0x00AB, 0x00AC,
                                    0x00B0, 0x00B1, 0x00B4, 0x00B7, 0x00BB,
                                    0x00E6, 0};

        bRet = wcschr(aPunct, wch) != 0;
      }
    else // check for CJK Punctutaion
    {
      static wchar_t jPunct[] =  {0x3001, 0x3002, 0x3003, 0x30FB,
                                  0x2010, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x2039, 0x203A, 0x203B,
                                  0xFF01, 0xFF02, 0xFF07, 0xFF08, 0xFF09, 0xFF0A, 0xFF0B, 0xFF0C, 0xFF0D, 0xFF0E, 0xFF0F, 0xFF1A, 0xFF1B, 0xFF1c, 0xFF1D, 0xFF1E,
                                  0xFF3B, 0xFF3C, 0xFF3D, 0xFF3E, 0xFF3F, 0xFF40, 0xFF5B, 0xFF5C, 0xFF5D, 0xFF5E, 0xFF5F, 0xFF60, 0xFF61, 0xFF62, 0xFF63, 0xFF64,
                                  0xFF65, 0xFF70, 0xFF9E, 0xFF9F, 0xFF1F, 0};

	    if ((wch >= 0x3001 && wch <= 0x301F) || (wch >= 0xFE50 && wch <= 0xFE5E) || (wch >= 0xFE51 && wch <= 0xFE68) || (wcschr(jPunct, wch) != 0))
        bRet = true;
    }

	  return bRet;
  }

  bool CSymbTypes::IsItSpace(wchar_t wch)
  {
    bool bRet = false;
    static wchar_t lPunct[] = {0x0009, 0x000A, 0x00D, 0x0020, 0x00A0, 0x3000, 0};
    // TODO: maybe extend http://jkorpela.fi/chars/spaces.html
                              
	  if (wcschr(lPunct, wch)) bRet = true;

	  return bRet;
  }

  wchar_t CSymbTypes::toUpper(wchar_t wch)
  {
    if(wch <= 128)
    {
      if(wch >= 0x61 && wch <= 0x7a)
        return (wch - 32);
      return wch;
    }
    else if (wch < nUppLowCharacter)
    {
      return pToUpperChar[wch];
    }
    else if(wch > 0xFF00)
    {
      if(wch >= 0xff41 && wch <= 0xff5A)
        return wch - 0x20;
      return wch;
    }

	  return wch;
  }

  wchar_t CSymbTypes::toLower(wchar_t wch)
  {
    if(wch <= 128)
    {
      if(wch >= 0x41 && wch <= 0x5a)
          return (wch + 32);
      return wch;
    }
    else if (wch < nUppLowCharacter)
    {
      return pToLowerChar[wch];
    }
    else if(wch > 0xFF00)
    {
      if(wch >= 0xff21 && wch <= 0xff3A)
          return wch + 0x20;
      return wch;
    }

    return wch;
  }

}
}
}
}