#ifndef _ense_tokenization_
#define _ense_tokenization_

#include <string>
#include <vector>

namespace evernote {
namespace cosm {
namespace util {
namespace token {


enum class eTokenType 
{
  WORD,
  PUNCT,
  SPACE, // token will include only space characters without newline
  NEWLINE // newline and possibly other space chars
};

struct SToken
{
    std::wstring word;
    std::wstring wordLwr; // lowercase
    int start; // position in unicode text
    eTokenType type;

    bool bFirstCapital = false;
};

struct STokenizerParam 
{
  bool bSaveSpaces = false;
  bool bSaveNewlines = true;
  bool bSavePunctuation = false;
  bool bSavePunctuationInsideWords = true;
  bool bSplitByUppercaseSymbols = false;
};

std::vector<SToken> tokenize(const std::wstring& input, const STokenizerParam& param);
std::vector<std::wstring> suffix_tokenize(const std::wstring& input, int max_token_length);
std::vector<std::wstring> alternative_tokenize(const std::wstring& input, int max_token_length);

std::wstring token_to_lowercase_token(const std::wstring& input);

}
}
}
}




#endif