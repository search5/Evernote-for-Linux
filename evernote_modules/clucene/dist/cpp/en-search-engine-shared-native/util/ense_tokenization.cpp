#include "ense_tokenization.h"

#include <iterator>

#include "ense_symb_type.h"

namespace evernote {
namespace cosm {
namespace util {
namespace token {

  bool containsNewline(size_t start, size_t end, const std::wstring& wsText) 
  {
    for (size_t nC = start; nC < end; ++nC) 
    {
      if (wsText[nC] == L'\n')
      {
        return true;
      }
    }
    return false;
  }

  void createToken(size_t start, size_t end, const std::wstring& wsText, eTokenType type, std::vector<SToken>& vTokens)
  {
    if (end <= start || end > wsText.size())
        return; 

    SToken tok;
    tok.type = type;
    
    tok.word = wsText.substr(start, end - start);
    // tok.wordLwr.reserve(end - start);
    tok.start = start;

    // for (size_t nC = start; nC < end; ++nC)
    // {
    //     wchar_t wcLower = CSymbTypes::toLower(wsText[nC]);
    //     tok.wordLwr.push_back(wcLower);
    //     if (nC == start && wcLower != wsText[nC])
    //         tok.bFirstCapital = true;
    // }

    vTokens.push_back(tok);
  }

  std::vector<SToken> tokenize(const std::wstring& wsText, const STokenizerParam& param)
  {
    std::vector<SToken> vTokens;

    size_t start = 0;
    size_t wordEnd = 0; // Potentional end of word (first punctuation symbol after word symbol).
    bool bInWord = false; // We are in word sequence, that may include word chars and punctuation
    auto prevType = eTokenType::SPACE; // token type is used here as a character type

    auto bPrevIsLowerspace = false;

    for (size_t nC = 0; nC <= wsText.size(); ++nC) 
    {
      // space character or text end
      bool isSpace = nC == wsText.size() ? true : CSymbTypes::IsItSpace(wsText[nC]);
      if (isSpace) 
      {
        if (prevType == eTokenType::SPACE) 
        {
          continue;
        }
        else if (bInWord && prevType == eTokenType::PUNCT) {
          createToken(start, wordEnd, wsText, eTokenType::WORD, vTokens);
          if (param.bSavePunctuation) {
            createToken(wordEnd, nC, wsText, eTokenType::PUNCT, vTokens);
          }
        }
        else if (bInWord) 
        {
          createToken(start, nC, wsText, eTokenType::WORD, vTokens);
        } 
        else if (prevType == eTokenType::PUNCT) 
        {
          if (param.bSavePunctuation) {
            createToken(start, nC, wsText, eTokenType::PUNCT, vTokens);
          }
        }

        start = nC;
        bInWord = false;
        prevType = eTokenType::SPACE;
        continue;
      } 

      // punctuation 
      bool isPunct = CSymbTypes::IsItPunct(wsText[nC]);
      if (isPunct) {
        if (prevType == eTokenType::PUNCT)
        {
          continue;
        }
        else if (prevType == eTokenType::SPACE)
        {
          if (param.bSaveSpaces || param.bSaveNewlines)
          {
            auto type = containsNewline(start, nC, wsText) ? eTokenType::NEWLINE : eTokenType::SPACE;
            if (param.bSaveSpaces || (param.bSaveNewlines && type == eTokenType::NEWLINE))
              createToken(start, nC, wsText, type, vTokens);
          }
          start = nC;
        }
        else if (prevType == eTokenType::WORD) 
        {
          wordEnd = nC;
        }

        prevType = eTokenType::PUNCT;
        continue;
      }

      // word character
      {
        if (prevType == eTokenType::WORD)
        {
          if (param.bSplitByUppercaseSymbols && bPrevIsLowerspace && CSymbTypes::isUpper(wsText[nC])) {
            createToken(start, nC, wsText, eTokenType::WORD, vTokens);
            start = nC;
          }
          bPrevIsLowerspace = CSymbTypes::isLower(wsText[nC]);
          continue;
        }
        else if (prevType == eTokenType::SPACE)
        {
          if (param.bSaveSpaces || param.bSaveNewlines)
          {
            auto type = containsNewline(start, nC, wsText) ? eTokenType::NEWLINE : eTokenType::SPACE;
            if (param.bSaveSpaces || (param.bSaveNewlines && type == eTokenType::NEWLINE))
              createToken(start, nC, wsText, type, vTokens);
          }
          start = nC;
        }
        else if (prevType == eTokenType::PUNCT) 
        {
          if (!bInWord) {
            if (param.bSavePunctuation) {
              createToken(start, nC, wsText, eTokenType::PUNCT, vTokens);
            }
            start = nC;
          } else {
            if (!param.bSavePunctuationInsideWords) {
              createToken(start, wordEnd, wsText, eTokenType::WORD, vTokens);
              start = nC;
            }
          }

        }

        bInWord = true;
        prevType = eTokenType::WORD;
      }
    }

    return vTokens;
  }

  std::vector<std::wstring> suffix_tokenize(const std::wstring& input, int max_token_length)
  {
    std::vector<std::wstring> suffix_tokens;

    evernote::cosm::util::token::STokenizerParam tokenize_parameters;
    tokenize_parameters.bSaveSpaces = false;
    tokenize_parameters.bSaveNewlines = false;
    tokenize_parameters.bSavePunctuation = true;

    auto tokens = evernote::cosm::util::token::tokenize(input, tokenize_parameters);
    for (const auto& token : tokens) {

      for (auto it = token.word.begin(); it != token.word.end(); ++it) {
        auto suffix_token_length = std::distance(it, token.word.end());
        auto end_iterator = suffix_token_length > max_token_length ? (it + max_token_length) : token.word.end();

        suffix_tokens.emplace_back(std::wstring(it, end_iterator));
      }
    }

    return suffix_tokens;
  }

  std::vector<std::wstring> alternative_tokenize(const std::wstring& input, int max_token_length)
  {
    std::vector<std::wstring> alternative_tokens;

    evernote::cosm::util::token::STokenizerParam tokenize_parameters;
    tokenize_parameters.bSaveSpaces = false;
    tokenize_parameters.bSaveNewlines = false;
    tokenize_parameters.bSavePunctuation = false;
    tokenize_parameters.bSavePunctuationInsideWords = false;
    tokenize_parameters.bSplitByUppercaseSymbols = true;

    auto tokens = evernote::cosm::util::token::tokenize(input, tokenize_parameters);
    for (const auto& token : tokens) {
      alternative_tokens.emplace_back(token.word);
    }

    return alternative_tokens;
  }

}
}
}
}