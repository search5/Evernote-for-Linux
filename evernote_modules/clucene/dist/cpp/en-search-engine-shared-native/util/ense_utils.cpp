#include <string.h>
#include <cmath>

#include <unordered_set>

#include "ense_utils.h"
#include "enml_parser.h"

namespace util {
    static const unsigned char utf8d[] = {
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,

    070,070,070,070,070,070,070,070,070,070,070,070,070,070,070,070,
    050,050,050,050,050,050,050,050,050,050,050,050,050,050,050,050,
    030,030,030,030,030,030,030,030,030,030,030,030,030,030,030,030,
    030,030,030,030,030,030,030,030,030,030,030,030,030,030,030,030,
    204,204,188,188,188,188,188,188,188,188,188,188,188,188,188,188,
    188,188,188,188,188,188,188,188,188,188,188,188,188,188,188,188,
    174,158,158,158,158,158,158,158,158,158,158,158,158,142,126,126,
    111, 95, 95, 95, 79,207,207,207,207,207,207,207,207,207,207,207,

    0,1,1,1,8,7,6,4,5,4,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,
    1,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,
    1,1,1,4,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,8,7,6,4,5,4,3,2,1,1,1,1,
    };

    bool utf_to_unic2(unsigned char *utfSq, wchar_t &unicSym) // TODO: remove duplicate (also in LexGen)
    {// tries to convert utf-sequence in the Unicode character
        unsigned char data, byte, stat = 9;
        unsigned int unic = 0;
        int pos = 0, len = (int)strlen((const char*)utfSq);
        while ((byte = *utfSq++))
        {
            data = utf8d[ byte ];
            stat = utf8d[ 256 + (stat << 4) + (data >> 4) ];
            unsigned char c = (unsigned char)((data << 4) & 0xff);
            byte = (byte ^ c);
            unic = (unic << 6) | byte;
            if (!stat)
            {// we got Unicode character
                if (pos == len - 1)
                {
                    unicSym = (wchar_t) unic;
                    return true;
                }
                else
                    return false;
            }
            if (stat == 1) // the byte is not allowed here
                return false;
            ++pos;
        }
        return false;
    }

    bool ucs2_to_utf8(const wchar_t &unicSym, unsigned char *utfSq)
    {
        int pos = 0;
        if (unicSym <= 0x80)
        {
            utfSq[pos++] = 0xff & unicSym;
        }
        else
            if(unicSym <= 0x800)
            {
                utfSq[pos++] = 0xc0 | (unicSym >> 6);
                utfSq[pos++] = 0x80 | (unicSym & 0x3f);
            }
            else
                if(unicSym <= 0x10000)
                {
                    utfSq[pos++] = 0xe0 | (unicSym >> 12);
                    utfSq[pos++] = 0x80 | ((unicSym >> 6) & 0x3f);
                    utfSq[pos++] = 0x80 | (unicSym & 0x3f);
                }
                else
                    return false;

        utfSq[pos] = 0;
        return true;
    }

    // convert utf-8 bytes to wstring
    void UtfFile2Wstring(const char * text, size_t size, std::wstring& strUni, std::vector<int> *pArUtfEndPos)
    {
        unsigned char utf[5];
        utf[4] = 0;
        int nCurLen = 0;
        int pos = 0;

        strUni.clear();
        strUni.reserve(size);

        if (pArUtfEndPos)
        {
            pArUtfEndPos->clear();
            pArUtfEndPos->reserve(size);
        }
        
        wchar_t wchCrr = 0;
        bool bUtfNotFinished = false;
        for (unsigned long long int i = 0; i < size; ++i)
        {
            if (pos == 4)
            {
                pos = 0;
                continue;
            }
            utf[pos++] = text[i];
            utf[pos] = 0;
            bUtfNotFinished = true;
            if (utf_to_unic2((unsigned char*)utf, wchCrr))
            {
                strUni.push_back(wchCrr);

                if (pArUtfEndPos)
                    pArUtfEndPos->push_back(i);

                wchCrr = 0;
                pos = 0;
                bUtfNotFinished = false;
            }

            if (wchCrr > 0) // never happens?!
            {
                if (wchCrr >= 65313 && (wchCrr < 65313 + 26)) // transfrom fullwidth char to halfwidth form
                    wchCrr = 65 + (wchCrr - 65313);
                strUni.push_back(wchCrr);

                if (pArUtfEndPos)
                    pArUtfEndPos->push_back((int)i);
            }
        }

        if (bUtfNotFinished == true)
        {
            strUni.clear();
            if (pArUtfEndPos)
                pArUtfEndPos->clear();
        }
    }

    // create wstring from utf-8 bytes contained in string
    std::wstring toWstring(const std::string & sText)
    {
        std::wstring wsText;
        util::UtfFile2Wstring(sText.c_str(), sText.size(), wsText);
        return wsText;
    }

    // convert wstring to unicode
	void Wstring2Utf(const std::wstring & sUni, std::string & sUtf)
	{
		unsigned char utf[6];
		for (const wchar_t & wChar : sUni)
		{
			ucs2_to_utf8(wChar, utf);
			sUtf.insert(sUtf.size(), std::string((char*)utf));
		}
	}

    // create unicode string from wstring
	std::string toUtf(const std::wstring & sUni)
	{
		std::string sUtf;
		Wstring2Utf(sUni, sUtf);
		return sUtf;
	}

    /* 
   base64.cpp and base64.h

   Copyright (C) 2004-2008 René Nyffenegger

   This source code is provided 'as-is', without any express or implied
   warranty. In no event will the author be held liable for any damages
   arising from the use of this software.

   Permission is granted to anyone to use this software for any purpose,
   including commercial applications, and to alter it and redistribute it
   freely, subject to the following restrictions:

   1. The origin of this source code must not be misrepresented; you must not
      claim that you wrote the original source code. If you use this source code
      in a product, an acknowledgment in the product documentation would be
      appreciated but is not required.

   2. Altered source versions must be plainly marked as such, and must not be
      misrepresented as being the original source code.

   3. This notice may not be removed or altered from any source distribution.

   René Nyffenegger rene.nyffenegger@adp-gmbh.ch

*/

static const std::string base64_chars = 
             "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "abcdefghijklmnopqrstuvwxyz"
             "0123456789+/";


static inline bool is_base64(unsigned char c) {
  return (isalnum(c) || (c == '+') || (c == '/'));
}

std::string base64_encode(unsigned char const* bytes_to_encode, unsigned int in_len) {
  std::string ret;
  int i = 0;
  int j = 0;
  unsigned char char_array_3[3];
  unsigned char char_array_4[4];

  while (in_len--) {
    char_array_3[i++] = *(bytes_to_encode++);
    if (i == 3) {
      char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
      char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
      char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
      char_array_4[3] = char_array_3[2] & 0x3f;

      for(i = 0; (i <4) ; i++)
        ret += base64_chars[char_array_4[i]];
      i = 0;
    }
  }

  if (i)
  {
    for(j = i; j < 3; j++)
      char_array_3[j] = '\0';

    char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
    char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
    char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
    char_array_4[3] = char_array_3[2] & 0x3f;

    for (j = 0; (j < i + 1); j++)
      ret += base64_chars[char_array_4[j]];

    while((i++ < 3))
      ret += '=';

  }

  return ret;

}
std::string base64_decode(std::string const& encoded_string) {
  int in_len = encoded_string.size();
  int i = 0;
  int j = 0;
  int in_ = 0;
  unsigned char char_array_4[4], char_array_3[3];
  std::string ret;

  while (in_len-- && ( encoded_string[in_] != '=') && is_base64(encoded_string[in_])) {
    char_array_4[i++] = encoded_string[in_]; in_++;
    if (i ==4) {
      for (i = 0; i <4; i++)
        char_array_4[i] = base64_chars.find(char_array_4[i]);

      char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
      char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
      char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

      for (i = 0; (i < 3); i++)
        ret += char_array_3[i];
      i = 0;
    }
  }

  if (i) {
    for (j = i; j <4; j++)
      char_array_4[j] = 0;

    for (j = 0; j <4; j++)
      char_array_4[j] = base64_chars.find(char_array_4[j]);

    char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
    char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
    char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

    for (j = 0; (j < i - 1); j++) ret += char_array_3[j];
  }

  return ret;
}

std::string format_exception(const std::string& method, const std::string& exception_type, const std::string& reason)
{
  return "CLucene: " + method + ": " + exception_type + ": " + reason;
}

int hex_value(unsigned char hex_digit)
{
    static const signed char hex_values[256] = {
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
         0,  1,  2,  3,  4,  5,  6,  7,  8,  9, -1, -1, -1, -1, -1, -1,
        -1, 10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, 10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    };
    int value = hex_values[hex_digit];
    return value;
}

std::string hex_decode(const std::string& hex_buffer) 
{
  const auto hex_buffer_length = hex_buffer.length();
  if (hex_buffer_length % 2 != 0) {
    return "";
  }

  std::string decoded_buffer;
  decoded_buffer.reserve(hex_buffer_length / 2);

  for (auto it = hex_buffer.begin(); it != hex_buffer.end(); )
    {
        int high = hex_value(*it++);
        int low = hex_value(*it++);
        if ((high == -1) || (low == -1)) {
          return "";
        }
        decoded_buffer.push_back(high << 4 | low);
    }

  return decoded_buffer;
}

std::pair<std::string, std::string> enml_to_plain_text(const std::string& enml)
{
  std::string error;
  std::string plain_text;
  try {
    if (!enmlToPlainText(enml, plain_text)) {
      error = util::format_exception("enml_to_plain_text", "parse exception", "parse exception");
      plain_text.clear();
    }
  } catch (std::exception& exception) {
      error = util::format_exception("enml_to_plain_text", "std::exception", "masked exception");
      plain_text.clear();
  } catch(...) {
      error = util::format_exception("enml_to_plain_text", "unknown exception", "unknown");
      plain_text.clear();
  }
  return std::make_pair(error, plain_text);
}

std::wstring join_strings(const std::vector<std::wstring>& input, const std::wstring& delimeter)
{
  std::wstring result;

  if (input.empty()) {
    return result;
  }

  for (const auto& element : input) {
    result += element + delimeter;
  }

  if (!delimeter.empty()) {
    result.erase(result.size() - delimeter.size(), delimeter.size());
  }

  return result;
}

float sigmoid(float input)
{
  return 1.0 / (1.0 + std::exp(-input));
}

float sigmoid_inverse(float sigmoid_input)
{
  return std::log(sigmoid_input / (1.0 - sigmoid_input));
}


}

