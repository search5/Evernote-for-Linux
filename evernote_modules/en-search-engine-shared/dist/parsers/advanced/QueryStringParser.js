"use strict";
/*
 * Copyright 2020 Evernote Corporation. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const QueryToken_1 = require("./QueryToken");
const FieldOperator_1 = require("./FieldOperator");
const GlobalOperator_1 = require("./GlobalOperator");
//Port of the backend QueryStringParser (commit sha1: dc5add4997c654ab73aca24dcfd1bfc91790afaf)
/**
 * Represents query tree.
 */
class QSPNode {
    constructor(token, parent) {
        this.token = token;
        this.parent = parent;
        this.children = new Array();
    }
}
exports.QSPNode = QSPNode;
class ParsedQuery {
    constructor() {
        this.success = true;
    }
    setError(errorMsg) {
        this.success = false;
        this.errorMessage = errorMsg;
        return this;
    }
}
class QueryStringParserParam {
    constructor() {
        this.timeZone = null;
        this.booleanOperatorsEnabled = false;
        this.stopWords = null;
    }
    setBooleanOperatorsEnabled(booleanOperatorsEnabled) {
        this.booleanOperatorsEnabled = booleanOperatorsEnabled;
        return this;
    }
    setTimeZone(timeZone) {
        this.timeZone = timeZone;
        return this;
    }
}
exports.QueryStringParserParam = QueryStringParserParam;
/**
* Checks that all tokens in the query are operators from predefined list.
*/
class QSPCheckMetadataOperators {
    constructor() {
        this.success = true;
    }
    beforeEnter(node) { }
    enter(node) {
        const token = node.token;
        if (token.type != QueryToken_1.QSPTokenType.ARGUMENT) // not a leaf node
            return;
        if (!token.isFieldOperator() || !FieldOperator_1.QSPFieldOperatorContext.isMetadataOperator(token.fieldOperator)) {
            this.success = false;
        }
    }
    afterEnter(node) { }
}
/**
* Converts tree to infix form (human readable).
*/
// class SimplePrinter implements NodeVisitorConst {
//     private sb: string;
//     public beforeEnter(node: Node): void {
//         if (node.parent != null && this.useParentheses(node.token, node.parent.token)) {
//             this.sb.concat('(');  
//         }
//     }
//     public enter(node: Node): void {
//         const token = node.token;
//         if (token.type === TokenType.AND) {
//             this.sb.concat(' AND ');
//         } else if (token.type === TokenType.NOT) {
//             this.sb.concat('NOT ');
//         } else if (token.type === TokenType.OR) {
//             this.sb.concat(' OR ');
//         } else if (token.type === TokenType.ARGUMENT) {
//             // todo(vglazkov) check this
//             this.sb.concat(token.toString());
//         } else {
//             throw new Error("Error printing query: Unknown token type");
//         }
//     }
//     public afterEnter(node: Node): void {
//         if (node.parent !== null && this.useParentheses(node.token, node.parent.token)) {
//             this.sb.concat(')');
//         }
//     }
//     protected useParentheses(child: QueryToken, parent: QueryToken): boolean {
//         return child.type !== TokenType.ARGUMENT && QueryStringParser.less(child.type, parent.type);
//     }
//     public toString(): string {
//       return this.sb;
//     }
// }
var QSPActionType;
(function (QSPActionType) {
    QSPActionType[QSPActionType["CONTINUE"] = 0] = "CONTINUE";
    QSPActionType[QSPActionType["EXIT_NODE"] = 1] = "EXIT_NODE";
    QSPActionType[QSPActionType["DELETE_NODE"] = 2] = "DELETE_NODE";
})(QSPActionType = exports.QSPActionType || (exports.QSPActionType = {}));
/**
* Removes all field operators from a tree
*/
class QSPRemoveFieldOperators {
    process(node) {
        if (node === null) {
            return QSPActionType.DELETE_NODE;
        }
        if (node.token.isFieldOperator()) {
            return QSPActionType.DELETE_NODE;
        }
        return QSPActionType.CONTINUE;
    }
}
/**
 * Limits number of ARGUMENT (ie actual words) nodes in a tree
 */
// class LimitTreeSize implements NodeVisitor {
//     private numNodes: number = 0;
//     private maxNodes: number | null = null;
//     constructor(maxNodes: number) {
//       this.maxNodes = maxNodes;
//     }
//     public process(node: Node): ActionType {
//         if (node.token.type === TokenType.ARGUMENT) {
//             this.numNodes += 1;
//         }
//         if (this.maxNodes && this.numNodes > this.maxNodes) {
//             return ActionType.DELETE_NODE;
//         }
//         return ActionType.CONTINUE;
//     }
// }
/**
* Expands negated expressions. Pushes NOT operator down the tree to leaves (individual search terms).
* Elasticsearch and Lucene do not understand negation of complicated bracketed expressions.
*/
class QSPMoveNotOperatorDown {
    process(node) {
        const token = node.token;
        if (token.type === QueryToken_1.QSPTokenType.NOT) {
            let numNots = 1;
            let child = node.children[0];
            while (child.token.type === QueryToken_1.QSPTokenType.NOT) {
                //          child.parent = null; // TODO proper removal of deleted nodes
                child = child.children[0];
                numNots += 1;
            }
            if (numNots % 2 === 0) { // even number of NOT-s
                // replace current node with child
                node.token = child.token;
                node.children = child.children;
                for (const child2 of node.children) {
                    child2.parent = node;
                }
                //        child.parent = null; // TODO
            }
            else {
                if (child.token.type === QueryToken_1.QSPTokenType.OR || child.token.type === QueryToken_1.QSPTokenType.AND) {
                    // expand brackets
                    node.token = child.token.type === QueryToken_1.QSPTokenType.OR ? QueryToken_1.QSPQueryToken.fromTokenStr('AND') : QueryToken_1.QSPQueryToken.fromTokenStr('OR');
                    node.children = new Array();
                    for (const child2 of child.children) {
                        const negatedChild2 = new QSPNode(QueryToken_1.QSPQueryToken.fromTokenStr('NOT'), node);
                        child2.parent = negatedChild2;
                        negatedChild2.children = new Array(child2);
                        node.children.push(negatedChild2);
                    }
                }
                // else we've got a leaf node and have nothing to do
            }
        }
        return QSPActionType.CONTINUE;
    }
}
/**
* Removes global operators from query tree.
*/
class QSPRemoveGlobalOperators {
    constructor() {
        this.globalOperators = new Map();
    }
    process(node) {
        const token = node.token;
        if (token.type === QueryToken_1.QSPTokenType.ARGUMENT) {
            if (token.isFieldOperator() && token.fieldOperator === FieldOperator_1.QSPFieldOperator.geodistance) {
                const parts = token.fieldValue.split(',');
                const latitude = Number(parts[0]);
                const longitude = Number(parts[1]);
                this.globalOperators.set(GlobalOperator_1.QSPGeoType.GeoDistance, new GlobalOperator_1.QSPGeoDistance(latitude, longitude, parts[2]));
                return QSPActionType.DELETE_NODE;
            }
            if (token.isFieldOperator() && FieldOperator_1.QSPFieldOperatorContext.isCoordinateOperator(token.fieldOperator) &&
                token.fieldOperator !== FieldOperator_1.QSPFieldOperator.altitude) {
                if (!this.globalOperators.has(GlobalOperator_1.QSPGeoType.GeoBoundingBox)) {
                    this.globalOperators.set(GlobalOperator_1.QSPGeoType.GeoBoundingBox, new GlobalOperator_1.QSPGeoBoundingBox());
                }
                const geoBox = this.globalOperators.get(GlobalOperator_1.QSPGeoType.GeoBoundingBox);
                const negated = node.parent !== null && node.parent.token.type === QueryToken_1.QSPTokenType.NOT;
                if (token.prefixed) {
                    if (negated) { // -latitude:* case
                        geoBox.shouldExist = false;
                    }
                    return QSPActionType.DELETE_NODE;
                }
                const value = Number(token.fieldValue);
                if (token.fieldOperator === FieldOperator_1.QSPFieldOperator.latitude) {
                    if (negated) {
                        geoBox.top = Math.min(geoBox.top, value);
                    }
                    else {
                        geoBox.bottom = Math.max(geoBox.bottom, value);
                    }
                }
                if (token.fieldOperator === FieldOperator_1.QSPFieldOperator.longitude) {
                    if (negated) {
                        geoBox.right = Math.min(geoBox.right, value);
                    }
                    else {
                        geoBox.left = Math.max(geoBox.left, value);
                    }
                }
                return QSPActionType.DELETE_NODE;
            }
        }
        return QSPActionType.CONTINUE;
    }
    exportOperators() {
        if (this.globalOperators.size === 0) {
            return null;
        }
        return [...this.globalOperators.values()];
    }
}
/**
* Performs token postprocessing. Includes changes such as stop word removal, quotation and wildcard manipulations.
* Some of these operations may seem to be specific for Elasticsearch index structure. But we need the changes
* to bee visible to end clients, so they are performed here.
*/
class QSPPostProcessor {
    process(node) {
        const token = node.token;
        if (token.type === QueryToken_1.QSPTokenType.ARGUMENT) {
            // 1. remove stop words
            if (!token.isFieldOperator() && !token.quoted) {
                if (QueryStringParser.ENGLISH_STOP_WORDS.has(token.token.toLowerCase())) {
                    return QSPActionType.DELETE_NODE;
                }
            }
            // search will be performed on a field with text tokenization
            const fieldWithTokenization = !token.isFieldOperator() || (token.fieldOperator && FieldOperator_1.QSPFieldOperatorContext.TOKENIZATION_REQUIRED_OPERATORS.has(token.fieldOperator));
            // 2. add quotation for words with delimiters
            if (!token.quoted) {
                // If text has punctuation between normal characters, we should put it in quotes and ignore 'prefixed' parameter.
                // This is a patch to deal with 'PG&E'-like queries. Lucene removes '&' and transforms the query to 'PG E'.
                // To save situation we create a phrase query '"PG&E"'. It will also match "PG E", which is considered lesser evil.
                // (see discussion in S14 of "Evernote Search Technical Specification")
                // https://lucene.apache.org/core/5_2_1/analyzers-icu/org/apache/lucene/analysis/icu/segmentation/ICUTokenizer.html
                // see also http://www.unicode.org/reports/tr29/#Sentence_Boundaries
                const containsDelimiters = QueryStringParser.containsDelimitersInside(token.isFieldOperator() ? token.fieldValue : token.token);
                if (fieldWithTokenization && (containsDelimiters || token.containsCJK)) { // we don't need quotation for keyword-type index fields
                    token.quoted = true;
                    token.prefixed = false;
                }
            }
            // 3. Add wildcard operator to enforce prefix search (S2 of "Evernote Search Technical Specification")
            const negated = node.parent !== null && node.parent.token.type === QueryToken_1.QSPTokenType.NOT;
            if (!token.quoted && fieldWithTokenization && !negated) {
                token.prefixed = true;
            }
        }
        return QSPActionType.CONTINUE;
    }
}
/**
 * Parses search query string according to Evernote search grammar. Supports boolean operators.
 * Should be agnostic to any further restrictions (eg Elasticsearch grammar rules).
 * (Couldn't really achieve this since some evernote search rules heavily rely on Lucene search capabilities)
 *
 * Note that the word "operator" used over the code is ambiguous. When used in a boolean search context
 * it represents boolean operators listed in QueryToken.TokenType. First part of a token like notebook:ABC is called
 * an operator too (as described in FieldOperator class).
 */
class QueryStringParser {
    /**
    * Parses search query string according to Evernote search grammar.
    * If param.booleanOperatorsEnabled is set to true, full boolean grammar with OR-s and NOT-s will be used.
    * On the output we produce a binary tree that represents the parsed query in boolean form
    * (regardless of param.booleanOperatorsEnabled value).
    *
    * To print resulting tree in human readable form use toInfix() method.
    * Modification of a tree may be performed with help of modifyTree().
    */
    static parseWithParams(queryStr, param) {
        const result = new ParsedQuery();
        const queryWords = QueryStringParser.tokenizeSearchStrWithSeparateParentheses(queryStr, param.booleanOperatorsEnabled);
        const tokParam = new QueryToken_1.QSPConstructorParam();
        tokParam.timeZone = param.timeZone;
        tokParam.extractBooleanOperators = param.booleanOperatorsEnabled;
        let terms = new Array();
        for (let term of queryWords) {
            // Replaces minus sign attached to a word with a separate NOT operator.
            // Minus is interpreted as NOT operator only if it is attached to next term.
            if (term.startsWith("-") && term.length > 1) {
                terms.push(QueryStringParser.not());
                term = term.substring(1, term.length);
            }
            terms.push(QueryToken_1.QSPQueryToken.fromDefault(term, tokParam));
        }
        if (!QueryStringParser.validateAnyOperator(terms)) {
            return result.setError("Invalid usage of \"any:\" operator");
        }
        terms = QueryStringParser.addImpliedOperators(terms);
        if (param.booleanOperatorsEnabled) {
            if (!QueryStringParser.validateParenthesisUsage(terms)) {
                return result.setError("Unbalanced or empty parentheses");
            }
        }
        if (!QueryStringParser.validateOperatorUsage(terms)) {
            return result.setError("Invalid usage of operators");
        }
        // at this point we have valid query terms
        const searchWordTokens = new Array();
        const filterTokens = new Array();
        QueryStringParser.splitQueryWordsAndFilter(terms, searchWordTokens, filterTokens);
        const postproc = new QSPPostProcessor();
        const globalOps = new QSPRemoveGlobalOperators();
        const fullQueryPostfix = QueryStringParser.toPostfix(terms);
        result.postfixTerms = fullQueryPostfix.map(x => x.toString());
        result.fullQuery = QueryStringParser.toTree(fullQueryPostfix);
        result.fullQuery = QueryStringParser.modifyTree(result.fullQuery, new QSPMoveNotOperatorDown());
        result.fullQuery = QueryStringParser.modifyTree(result.fullQuery, globalOps);
        result.globalOperators = globalOps.exportOperators();
        result.fullQuery = QueryStringParser.modifyTree(result.fullQuery, postproc);
        result.filter = QueryStringParser.toTree(QueryStringParser.toPostfix(filterTokens));
        result.filter = QueryStringParser.modifyTree(result.filter, postproc);
        result.firstSearchWords = searchWordTokens.filter(x => x.type === QueryToken_1.QSPTokenType.ARGUMENT);
        result.searchWords = QueryStringParser.modifyTree(QueryStringParser.copyTree(result.fullQuery), new QSPRemoveFieldOperators());
        return result;
    }
    static parse(queryStr) {
        return QueryStringParser.parseWithParams(queryStr, QueryStringParser.defaultParam);
    }
    // Checks that query contains only metadata operators
    static isMetadataQuery(queryStr) {
        const pquery = QueryStringParser.parse(queryStr);
        if (!pquery.success)
            return false;
        if (pquery.globalOperators != null)
            return false;
        const metadataChecker = new QSPCheckMetadataOperators();
        QueryStringParser.toInfix(pquery.fullQuery, metadataChecker);
        return metadataChecker.success;
    }
    /**
    * Takes a search expression and tokenizes it into individual search terms, which may
    * either be literals (words or quoted phrased) or advanced search expressions.
    * Returns a set of the search terms.
    */
    static tokenizeSearchStr(words) {
        return QueryStringParser.tokenizeSearchStrWithSeparateParentheses(words, false);
    }
    static tokenizeSearchStrWithSeparateParentheses(words, separateParentheses) {
        const result = new Array();
        const wordPattern = new RegExp(separateParentheses ? QueryStringParser.SEARCH_WORD : QueryStringParser.SEARCH_WORD_WITH_PAREN, 'gmu');
        if (words !== null) {
            let match = wordPattern.exec(words);
            while (match !== null) {
                const word = match[1];
                result.push(word);
                match = wordPattern.exec(words);
            }
        }
        return result;
    }
    /**
    * Adds implied AND operators.
    * Replaces "any:" with "OR"-separated words enclosed in parentheses.
    */
    static addImpliedOperators(tokens) {
        const output = new Array();
        // Ignore "any:" if it is in the very end
        // ignore special unicode characters at the end
        // https://docs.microsoft.com/en-us/visualstudio/code-quality/ca1308-normalize-strings-to-uppercase?view=vs-2015&redirectedfrom=MSDN
        if (tokens.length !== 0 && tokens[(tokens.length - 1)].token.toUpperCase() === QueryStringParser.ANY.toUpperCase()) {
            tokens.pop();
        }
        let insideAny = false;
        for (let nT = 0; nT < tokens.length; ++nT) {
            const currToken = tokens[nT];
            const nextTok = nT < tokens.length - 1 ? tokens[nT + 1] : null;
            if (currToken.token.toUpperCase() === QueryStringParser.ANY.toUpperCase()) {
                insideAny = true;
                output.push(QueryStringParser.openparen());
            }
            else if ((currToken.type === QueryToken_1.QSPTokenType.ARGUMENT || currToken.type === QueryToken_1.QSPTokenType.CLOSEPAREN) && nextTok != null
                && (nextTok.type === QueryToken_1.QSPTokenType.ARGUMENT || nextTok.type === QueryToken_1.QSPTokenType.OPENPAREN || nextTok.type === QueryToken_1.QSPTokenType.NOT)) {
                // add implicit operator between search words
                output.push(currToken);
                output.push(QueryToken_1.QSPQueryToken.fromTokenStr(insideAny ? 'OR' : 'AND'));
            }
            else {
                output.push(currToken);
            }
        }
        if (insideAny) {
            output.push(QueryStringParser.closeparen());
        }
        return output;
    }
    /**
    * Validates "any:" operator usage.
    */
    static validateAnyOperator(tokens) {
        let insideAny = false;
        for (const currToken of tokens) {
            if (currToken.token.toUpperCase() === QueryStringParser.ANY.toUpperCase()) {
                if (insideAny) {
                    return false;
                }
                insideAny = true;
                continue;
            }
            // After "any:" only regular search terms are allowed
            if (insideAny && (currToken.type !== QueryToken_1.QSPTokenType.ARGUMENT && currToken.type !== QueryToken_1.QSPTokenType.NOT)) {
                return false;
            }
        }
        return true;
    }
    /**
    * Validates parenthesis usage.
    */
    static validateParenthesisUsage(tokens) {
        let parenBalance = 0;
        let maxFilledLevel = 0; // maximum depth of parentheses group where token of type argument was seen
        for (const token of tokens) {
            if (token.type === QueryToken_1.QSPTokenType.OPENPAREN) {
                parenBalance += 1;
            }
            if (token.type === QueryToken_1.QSPTokenType.CLOSEPAREN) {
                if (maxFilledLevel < parenBalance) {
                    return false;
                }
                else {
                    maxFilledLevel -= 1;
                }
                parenBalance -= 1;
                if (parenBalance < 0) {
                    return false;
                }
            }
            if (token.type === QueryToken_1.QSPTokenType.ARGUMENT) {
                maxFilledLevel = parenBalance;
            }
        }
        return parenBalance === 0;
    }
    /**
    * Checks that all operators have correct number of arguments
    */
    static validateOperatorUsage(tokens) {
        for (let nT = 0; nT < tokens.length; ++nT) {
            const currToken = tokens[nT];
            if (QueryStringParser.isUnaryOperator(currToken)) {
                const nextTok = nT < tokens.length - 1 ? tokens[nT + 1] : null;
                if (nextTok === null) {
                    return false;
                }
                if (!(nextTok.type === QueryToken_1.QSPTokenType.ARGUMENT || nextTok.type === QueryToken_1.QSPTokenType.OPENPAREN || nextTok.type === QueryToken_1.QSPTokenType.NOT)) {
                    return false;
                }
            }
            else if (QueryStringParser.isBinaryOperator(currToken)) {
                const prevTok = nT > 0 ? tokens[nT - 1] : null;
                const nextTok = nT < tokens.length - 1 ? tokens[nT + 1] : null;
                if (prevTok === null || nextTok === null) {
                    return false;
                }
                if (!(prevTok.type === QueryToken_1.QSPTokenType.ARGUMENT || prevTok.type === QueryToken_1.QSPTokenType.CLOSEPAREN)) {
                    return false;
                }
                if (!(nextTok.type === QueryToken_1.QSPTokenType.ARGUMENT || nextTok.type === QueryToken_1.QSPTokenType.OPENPAREN || nextTok.type === QueryToken_1.QSPTokenType.NOT)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
    * Finds border between simple query words and filter part of query. Modifies input arrays
    */
    static splitQueryWordsAndFilter(tokens, searchWordTokens, filterTokens) {
        let inFilter = false;
        for (let nT = 0; nT < tokens.length; ++nT) {
            const currToken = tokens[nT];
            if (!inFilter) {
                const nextToken = nT < tokens.length - 1 ? tokens[nT + 1] : null;
                const currTokOk = QueryStringParser.isSimpleWord(currToken) || currToken.type === QueryToken_1.QSPTokenType.AND || currToken.type === QueryToken_1.QSPTokenType.OR;
                const nextTokOk = nextToken === null || QueryStringParser.isSimpleWord(nextToken) || nextToken.type === QueryToken_1.QSPTokenType.AND || nextToken.type === QueryToken_1.QSPTokenType.OR;
                if (!(currTokOk && nextTokOk)) {
                    inFilter = true;
                    if (currToken.type === QueryToken_1.QSPTokenType.AND || currToken.type === QueryToken_1.QSPTokenType.OR) {
                        continue; // skip delimiting operator
                    }
                }
            }
            if (inFilter) {
                filterTokens.push(QueryToken_1.QSPQueryToken.fromQueryToken(currToken));
            }
            else {
                searchWordTokens.push(QueryToken_1.QSPQueryToken.fromQueryToken(currToken));
            }
        }
    }
    /**
    *
    */
    static isSimpleWord(token) {
        return token.type === QueryToken_1.QSPTokenType.ARGUMENT && !token.quoted && !(token.isValidFieldOperator && token.isValidFieldValue);
    }
    /**
    * Checks if operator 1 has less precedence than operator 2
    */
    // todo(vglazkov) check this
    static less(op1, op2) {
        return op1 > op2;
    }
    static isOperator(token) {
        return QueryStringParser.OPERATORS.has(token.type);
    }
    static isUnaryOperator(token) {
        return token.type === QueryToken_1.QSPTokenType.NOT;
    }
    static isBinaryOperator(token) {
        return token.type === QueryToken_1.QSPTokenType.AND || token.type === QueryToken_1.QSPTokenType.OR;
    }
    static openparen() {
        return QueryToken_1.QSPQueryToken.fromTokenStr('(');
    }
    static closeparen() {
        return QueryToken_1.QSPQueryToken.fromTokenStr(')');
    }
    static not() {
        return QueryToken_1.QSPQueryToken.fromTokenStr('NOT');
    }
    /**
    * Converts input expression from infix (human readable) to postfix model (aka polish notation) using shunting yard algorithm.
    * Assumes that input expression is syntactically correct (all verifications should be done in advance).
    */
    static toPostfix(terms) {
        const output = new Array();
        const operatorStack = new Array();
        for (const token of terms) {
            if (QueryStringParser.isOperator(token)) {
                while (operatorStack.length !== 0 && operatorStack[operatorStack.length - 1].type !== QueryToken_1.QSPTokenType.OPENPAREN && QueryStringParser.less(token.type, operatorStack[operatorStack.length - 1].type)) {
                    output.push(operatorStack.pop());
                }
                operatorStack.push(token);
            }
            else if (token.type === QueryToken_1.QSPTokenType.OPENPAREN) {
                operatorStack.push(token);
            }
            else if (token.type === QueryToken_1.QSPTokenType.CLOSEPAREN) {
                while (operatorStack.length !== 0) {
                    const op = operatorStack.pop();
                    if (op.type === QueryToken_1.QSPTokenType.OPENPAREN) {
                        break;
                    }
                    output.push(op);
                }
            }
            else if (token.type === QueryToken_1.QSPTokenType.ARGUMENT) {
                output.push(token);
            }
        }
        while (operatorStack.length !== 0) {
            output.push(operatorStack.pop());
        }
        return output;
    }
    /**
    * Converts input expression from postfix form to tree.
    * Returns null if token array is empty;
    */
    static toTree(tokens) {
        if (tokens.length === 0) {
            return null;
        }
        const outputStack = new Array();
        for (const token of tokens) {
            const newNode = new QSPNode(token, null);
            if (QueryStringParser.isOperator(token)) {
                const numArgs = QueryStringParser.OPERATOR_ARGS.get(token.type);
                if (outputStack.length < numArgs) {
                    throw new Error("Error transforming query to tree form: Wrong stack size");
                }
                for (let nA = 0; nA < numArgs; ++nA) {
                    const child = outputStack.pop();
                    if (child) {
                        child.parent = newNode;
                        newNode.children.push(child);
                    }
                }
            }
            newNode.children = newNode.children.reverse(); // this way we get correct order of leaves while traversing in DFS manner
            outputStack.push(newNode);
        }
        if (outputStack.length !== 1) {
            throw new Error("Error transforming query to tree form: Final stack size is not 1");
        }
        return outputStack.pop();
    }
    /**
    * Traverses tree and supplies nodes to visitor in an order suited for printing in infix form.
    * Visitor should never modify obtained node.
    */
    static toInfix(tree, visitor) {
        if (tree === null) {
            return;
        }
        if (QueryStringParser.isUnaryOperator(tree.token)) {
            if (tree.children.length !== 1) {
                throw new Error("Error transforming query to infix form: Invalid number of children");
            }
            visitor.enter(tree);
            const child = tree.children[0];
            visitor.beforeEnter(child);
            QueryStringParser.toInfix(child, visitor);
            visitor.afterEnter(child);
        }
        else if (QueryStringParser.isBinaryOperator(tree.token)) {
            if (tree.children.length !== 2) {
                throw new Error("Error transforming query to infix form: Invalid number of children");
            }
            const child1 = tree.children[0];
            const child2 = tree.children[1];
            visitor.beforeEnter(child1);
            QueryStringParser.toInfix(child1, visitor);
            visitor.afterEnter(child1);
            visitor.enter(tree);
            visitor.beforeEnter(child2);
            QueryStringParser.toInfix(child2, visitor);
            visitor.afterEnter(child2);
        }
        else {
            visitor.enter(tree);
        }
    }
    /**
    * Modifies tree. Visitor is allowed to modify given node and then select an action to proceed.
    */
    static modifyTree(tree, visitor) {
        if (tree === null) {
            return null;
        }
        const action = visitor.process(tree);
        if (action === QSPActionType.DELETE_NODE) {
            tree.parent = null;
            return null;
        }
        // You may not want to visit children if you modified node or it's children inside visitor.process(tree)
        if (action === QSPActionType.EXIT_NODE) {
            return tree;
        }
        if (action === QSPActionType.CONTINUE && QueryStringParser.isOperator(tree.token)) {
            for (let nC = 0; nC < tree.children.length; ++nC) {
                const child = tree.children[nC];
                const newChild = QueryStringParser.modifyTree(child, visitor);
                if (newChild === null) { // child was deleted
                    tree.children.splice(nC, 1);
                    nC -= 1; // do not loose next child
                }
                else if (newChild !== child) { // child was modified
                    newChild.parent = tree;
                    tree.children[nC] = newChild;
                }
            }
            // We have to modify current node because some children were deleted
            if (tree.children.length !== QueryStringParser.OPERATOR_ARGS.get(tree.token.type)) {
                tree.parent = null;
                if (tree.children.length === 0) { // remove current node entirely
                    return null;
                }
                if (tree.children.length === 1) { // return child instead of node, discard current node operator
                    const child = tree.children[0];
                    child.parent = null;
                    return child;
                }
                // more options are to be added when operators with 3 arguments appear
            }
        }
        return tree;
    }
    /**
    * Creates a deep copy of a tree
    */
    static copyTree(tree) {
        if (tree === null) {
            return null;
        }
        const newTree = new QSPNode(QueryToken_1.QSPQueryToken.fromQueryToken(tree.token), null);
        if (tree.children !== null) {
            for (const child of tree.children) {
                const newChild = QueryStringParser.copyTree(child);
                if (newChild === null) {
                    continue;
                }
                newChild.parent = newTree;
                newTree.children.push(newChild);
            }
        }
        return newTree;
    }
    /**
    * Checks if there are punctuation characters between regular characters.
    */
    static containsDelimitersInside(text) {
        return QueryStringParser.PUNCT_INSIDE_REGEX.test(text);
    }
}
exports.QueryStringParser = QueryStringParser;
QueryStringParser.defaultParam = new QueryStringParserParam();
// p{Z} stands for separators
// p{C} stands for unicode "Other" group, which include unused code points
// see http://www.unicode.org/reports/tr18/#General_Category_Property
// [^\\p{Z}\\p{C}\":\\)]
QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_QUOTED_WORDS_PART = "(?:(?![\\0- \"\\):\\\\\\x7F-\\xA0\\xAD\\u0378\\u0379\\u0380-\\u0383\\u038B\\u038D\\u03A2\\u0530\\u0557\\u0558\\u058B\\u058C\\u0590\\u05C8-\\u05CF\\u05EB-\\u05EE\\u05F5-\\u0605\\u061C\\u061D\\u06DD\\u070E\\u070F\\u074B\\u074C\\u07B2-\\u07BF\\u07FB\\u07FC\\u082E\\u082F\\u083F\\u085C\\u085D\\u085F\\u086B-\\u089F\\u08B5\\u08C8-\\u08D2\\u08E2\\u0984\\u098D\\u098E\\u0991\\u0992\\u09A9\\u09B1\\u09B3-\\u09B5\\u09BA\\u09BB\\u09C5\\u09C6\\u09C9\\u09CA\\u09CF-\\u09D6\\u09D8-\\u09DB\\u09DE\\u09E4\\u09E5\\u09FF\\u0A00\\u0A04\\u0A0B-\\u0A0E\\u0A11\\u0A12\\u0A29\\u0A31\\u0A34\\u0A37\\u0A3A\\u0A3B\\u0A3D\\u0A43-\\u0A46\\u0A49\\u0A4A\\u0A4E-\\u0A50\\u0A52-\\u0A58\\u0A5D\\u0A5F-\\u0A65\\u0A77-\\u0A80\\u0A84\\u0A8E\\u0A92\\u0AA9\\u0AB1\\u0AB4\\u0ABA\\u0ABB\\u0AC6\\u0ACA\\u0ACE\\u0ACF\\u0AD1-\\u0ADF\\u0AE4\\u0AE5\\u0AF2-\\u0AF8\\u0B00\\u0B04\\u0B0D\\u0B0E\\u0B11\\u0B12\\u0B29\\u0B31\\u0B34\\u0B3A\\u0B3B\\u0B45\\u0B46\\u0B49\\u0B4A\\u0B4E-\\u0B54\\u0B58-\\u0B5B\\u0B5E\\u0B64\\u0B65\\u0B78-\\u0B81\\u0B84\\u0B8B-\\u0B8D\\u0B91\\u0B96-\\u0B98\\u0B9B\\u0B9D\\u0BA0-\\u0BA2\\u0BA5-\\u0BA7\\u0BAB-\\u0BAD\\u0BBA-\\u0BBD\\u0BC3-\\u0BC5\\u0BC9\\u0BCE\\u0BCF\\u0BD1-\\u0BD6\\u0BD8-\\u0BE5\\u0BFB-\\u0BFF\\u0C0D\\u0C11\\u0C29\\u0C3A-\\u0C3C\\u0C45\\u0C49\\u0C4E-\\u0C54\\u0C57\\u0C5B-\\u0C5F\\u0C64\\u0C65\\u0C70-\\u0C76\\u0C8D\\u0C91\\u0CA9\\u0CB4\\u0CBA\\u0CBB\\u0CC5\\u0CC9\\u0CCE-\\u0CD4\\u0CD7-\\u0CDD\\u0CDF\\u0CE4\\u0CE5\\u0CF0\\u0CF3-\\u0CFF\\u0D0D\\u0D11\\u0D45\\u0D49\\u0D50-\\u0D53\\u0D64\\u0D65\\u0D80\\u0D84\\u0D97-\\u0D99\\u0DB2\\u0DBC\\u0DBE\\u0DBF\\u0DC7-\\u0DC9\\u0DCB-\\u0DCE\\u0DD5\\u0DD7\\u0DE0-\\u0DE5\\u0DF0\\u0DF1\\u0DF5-\\u0E00\\u0E3B-\\u0E3E\\u0E5C-\\u0E80\\u0E83\\u0E85\\u0E8B\\u0EA4\\u0EA6\\u0EBE\\u0EBF\\u0EC5\\u0EC7\\u0ECE\\u0ECF\\u0EDA\\u0EDB\\u0EE0-\\u0EFF\\u0F48\\u0F6D-\\u0F70\\u0F98\\u0FBD\\u0FCD\\u0FDB-\\u0FFF\\u10C6\\u10C8-\\u10CC\\u10CE\\u10CF\\u1249\\u124E\\u124F\\u1257\\u1259\\u125E\\u125F\\u1289\\u128E\\u128F\\u12B1\\u12B6\\u12B7\\u12BF\\u12C1\\u12C6\\u12C7\\u12D7\\u1311\\u1316\\u1317\\u135B\\u135C\\u137D-\\u137F\\u139A-\\u139F\\u13F6\\u13F7\\u13FE\\u13FF\\u1680\\u169D-\\u169F\\u16F9-\\u16FF\\u170D\\u1715-\\u171F\\u1737-\\u173F\\u1754-\\u175F\\u176D\\u1771\\u1774-\\u177F\\u17DE\\u17DF\\u17EA-\\u17EF\\u17FA-\\u17FF\\u180E\\u180F\\u181A-\\u181F\\u1879-\\u187F\\u18AB-\\u18AF\\u18F6-\\u18FF\\u191F\\u192C-\\u192F\\u193C-\\u193F\\u1941-\\u1943\\u196E\\u196F\\u1975-\\u197F\\u19AC-\\u19AF\\u19CA-\\u19CF\\u19DB-\\u19DD\\u1A1C\\u1A1D\\u1A5F\\u1A7D\\u1A7E\\u1A8A-\\u1A8F\\u1A9A-\\u1A9F\\u1AAE\\u1AAF\\u1AC1-\\u1AFF\\u1B4C-\\u1B4F\\u1B7D-\\u1B7F\\u1BF4-\\u1BFB\\u1C38-\\u1C3A\\u1C4A-\\u1C4C\\u1C89-\\u1C8F\\u1CBB\\u1CBC\\u1CC8-\\u1CCF\\u1CFB-\\u1CFF\\u1DFA\\u1F16\\u1F17\\u1F1E\\u1F1F\\u1F46\\u1F47\\u1F4E\\u1F4F\\u1F58\\u1F5A\\u1F5C\\u1F5E\\u1F7E\\u1F7F\\u1FB5\\u1FC5\\u1FD4\\u1FD5\\u1FDC\\u1FF0\\u1FF1\\u1FF5\\u1FFF-\\u200F\\u2028-\\u202F\\u205F-\\u206F\\u2072\\u2073\\u208F\\u209D-\\u209F\\u20C0-\\u20CF\\u20F1-\\u20FF\\u218C-\\u218F\\u2427-\\u243F\\u244B-\\u245F\\u2B74\\u2B75\\u2B96\\u2C2F\\u2C5F\\u2CF4-\\u2CF8\\u2D26\\u2D28-\\u2D2C\\u2D2E\\u2D2F\\u2D68-\\u2D6E\\u2D71-\\u2D7E\\u2D97-\\u2D9F\\u2DA7\\u2DAF\\u2DB7\\u2DBF\\u2DC7\\u2DCF\\u2DD7\\u2DDF\\u2E53-\\u2E7F\\u2E9A\\u2EF4-\\u2EFF\\u2FD6-\\u2FEF\\u2FFC-\\u3000\\u3040\\u3097\\u3098\\u3100-\\u3104\\u3130\\u318F\\u31E4-\\u31EF\\u321F\\u9FFD-\\u9FFF\\uA48D-\\uA48F\\uA4C7-\\uA4CF\\uA62C-\\uA63F\\uA6F8-\\uA6FF\\uA7C0\\uA7C1\\uA7CB-\\uA7F4\\uA82D-\\uA82F\\uA83A-\\uA83F\\uA878-\\uA87F\\uA8C6-\\uA8CD\\uA8DA-\\uA8DF\\uA954-\\uA95E\\uA97D-\\uA97F\\uA9CE\\uA9DA-\\uA9DD\\uA9FF\\uAA37-\\uAA3F\\uAA4E\\uAA4F\\uAA5A\\uAA5B\\uAAC3-\\uAADA\\uAAF7-\\uAB00\\uAB07\\uAB08\\uAB0F\\uAB10\\uAB17-\\uAB1F\\uAB27\\uAB2F\\uAB6C-\\uAB6F\\uABEE\\uABEF\\uABFA-\\uABFF\\uD7A4-\\uD7AF\\uD7C7-\\uD7CA\\uD7FC-\\uD7FF\\uE000-\\uF8FF\\uFA6E\\uFA6F\\uFADA-\\uFAFF\\uFB07-\\uFB12\\uFB18-\\uFB1C\\uFB37\\uFB3D\\uFB3F\\uFB42\\uFB45\\uFBC2-\\uFBD2\\uFD40-\\uFD4F\\uFD90\\uFD91\\uFDC8-\\uFDEF\\uFDFE\\uFDFF\\uFE1A-\\uFE1F\\uFE53\\uFE67\\uFE6C-\\uFE6F\\uFE75\\uFEFD-\\uFF00\\uFFBF-\\uFFC1\\uFFC8\\uFFC9\\uFFD0\\uFFD1\\uFFD8\\uFFD9\\uFFDD-\\uFFDF\\uFFE7\\uFFEF-\\uFFFB\\uFFFE\\uFFFF]|\\uD800[\\uDC0C\\uDC27\\uDC3B\\uDC3E\\uDC4E\\uDC4F\\uDC5E-\\uDC7F\\uDCFB-\\uDCFF\\uDD03-\\uDD06\\uDD34-\\uDD36\\uDD8F\\uDD9D-\\uDD9F\\uDDA1-\\uDDCF\\uDDFE-\\uDE7F\\uDE9D-\\uDE9F\\uDED1-\\uDEDF\\uDEFC-\\uDEFF\\uDF24-\\uDF2C\\uDF4B-\\uDF4F\\uDF7B-\\uDF7F\\uDF9E\\uDFC4-\\uDFC7\\uDFD6-\\uDFFF]|\\uD801[\\uDC9E\\uDC9F\\uDCAA-\\uDCAF\\uDCD4-\\uDCD7\\uDCFC-\\uDCFF\\uDD28-\\uDD2F\\uDD64-\\uDD6E\\uDD70-\\uDDFF\\uDF37-\\uDF3F\\uDF56-\\uDF5F\\uDF68-\\uDFFF]|\\uD802[\\uDC06\\uDC07\\uDC09\\uDC36\\uDC39-\\uDC3B\\uDC3D\\uDC3E\\uDC56\\uDC9F-\\uDCA6\\uDCB0-\\uDCDF\\uDCF3\\uDCF6-\\uDCFA\\uDD1C-\\uDD1E\\uDD3A-\\uDD3E\\uDD40-\\uDD7F\\uDDB8-\\uDDBB\\uDDD0\\uDDD1\\uDE04\\uDE07-\\uDE0B\\uDE14\\uDE18\\uDE36\\uDE37\\uDE3B-\\uDE3E\\uDE49-\\uDE4F\\uDE59-\\uDE5F\\uDEA0-\\uDEBF\\uDEE7-\\uDEEA\\uDEF7-\\uDEFF\\uDF36-\\uDF38\\uDF56\\uDF57\\uDF73-\\uDF77\\uDF92-\\uDF98\\uDF9D-\\uDFA8\\uDFB0-\\uDFFF]|\\uD803[\\uDC49-\\uDC7F\\uDCB3-\\uDCBF\\uDCF3-\\uDCF9\\uDD28-\\uDD2F\\uDD3A-\\uDE5F\\uDE7F\\uDEAA\\uDEAE\\uDEAF\\uDEB2-\\uDEFF\\uDF28-\\uDF2F\\uDF5A-\\uDFAF\\uDFCC-\\uDFDF\\uDFF7-\\uDFFF]|\\uD804[\\uDC4E-\\uDC51\\uDC70-\\uDC7E\\uDCBD\\uDCC2-\\uDCCF\\uDCE9-\\uDCEF\\uDCFA-\\uDCFF\\uDD35\\uDD48-\\uDD4F\\uDD77-\\uDD7F\\uDDE0\\uDDF5-\\uDDFF\\uDE12\\uDE3F-\\uDE7F\\uDE87\\uDE89\\uDE8E\\uDE9E\\uDEAA-\\uDEAF\\uDEEB-\\uDEEF\\uDEFA-\\uDEFF\\uDF04\\uDF0D\\uDF0E\\uDF11\\uDF12\\uDF29\\uDF31\\uDF34\\uDF3A\\uDF45\\uDF46\\uDF49\\uDF4A\\uDF4E\\uDF4F\\uDF51-\\uDF56\\uDF58-\\uDF5C\\uDF64\\uDF65\\uDF6D-\\uDF6F\\uDF75-\\uDFFF]|\\uD805[\\uDC5C\\uDC62-\\uDC7F\\uDCC8-\\uDCCF\\uDCDA-\\uDD7F\\uDDB6\\uDDB7\\uDDDE-\\uDDFF\\uDE45-\\uDE4F\\uDE5A-\\uDE5F\\uDE6D-\\uDE7F\\uDEB9-\\uDEBF\\uDECA-\\uDEFF\\uDF1B\\uDF1C\\uDF2C-\\uDF2F\\uDF40-\\uDFFF]|\\uD806[\\uDC3C-\\uDC9F\\uDCF3-\\uDCFE\\uDD07\\uDD08\\uDD0A\\uDD0B\\uDD14\\uDD17\\uDD36\\uDD39\\uDD3A\\uDD47-\\uDD4F\\uDD5A-\\uDD9F\\uDDA8\\uDDA9\\uDDD8\\uDDD9\\uDDE5-\\uDDFF\\uDE48-\\uDE4F\\uDEA3-\\uDEBF\\uDEF9-\\uDFFF]|\\uD807[\\uDC09\\uDC37\\uDC46-\\uDC4F\\uDC6D-\\uDC6F\\uDC90\\uDC91\\uDCA8\\uDCB7-\\uDCFF\\uDD07\\uDD0A\\uDD37-\\uDD39\\uDD3B\\uDD3E\\uDD48-\\uDD4F\\uDD5A-\\uDD5F\\uDD66\\uDD69\\uDD8F\\uDD92\\uDD99-\\uDD9F\\uDDAA-\\uDEDF\\uDEF9-\\uDFAF\\uDFB1-\\uDFBF\\uDFF2-\\uDFFE]|\\uD808[\\uDF9A-\\uDFFF]|\\uD809[\\uDC6F\\uDC75-\\uDC7F\\uDD44-\\uDFFF]|[\\uD80A\\uD80B\\uD80E-\\uD810\\uD812-\\uD819\\uD824-\\uD82B\\uD82D\\uD82E\\uD830-\\uD833\\uD837\\uD839\\uD83F\\uD87B-\\uD87D\\uD87F\\uD885-\\uDB3F\\uDB41-\\uDBFF][\\uDC00-\\uDFFF]|\\uD80D[\\uDC2F-\\uDFFF]|\\uD811[\\uDE47-\\uDFFF]|\\uD81A[\\uDE39-\\uDE3F\\uDE5F\\uDE6A-\\uDE6D\\uDE70-\\uDECF\\uDEEE\\uDEEF\\uDEF6-\\uDEFF\\uDF46-\\uDF4F\\uDF5A\\uDF62\\uDF78-\\uDF7C\\uDF90-\\uDFFF]|\\uD81B[\\uDC00-\\uDE3F\\uDE9B-\\uDEFF\\uDF4B-\\uDF4E\\uDF88-\\uDF8E\\uDFA0-\\uDFDF\\uDFE5-\\uDFEF\\uDFF2-\\uDFFF]|\\uD821[\\uDFF8-\\uDFFF]|\\uD823[\\uDCD6-\\uDCFF\\uDD09-\\uDFFF]|\\uD82C[\\uDD1F-\\uDD4F\\uDD53-\\uDD63\\uDD68-\\uDD6F\\uDEFC-\\uDFFF]|\\uD82F[\\uDC6B-\\uDC6F\\uDC7D-\\uDC7F\\uDC89-\\uDC8F\\uDC9A\\uDC9B\\uDCA0-\\uDFFF]|\\uD834[\\uDCF6-\\uDCFF\\uDD27\\uDD28\\uDD73-\\uDD7A\\uDDE9-\\uDDFF\\uDE46-\\uDEDF\\uDEF4-\\uDEFF\\uDF57-\\uDF5F\\uDF79-\\uDFFF]|\\uD835[\\uDC55\\uDC9D\\uDCA0\\uDCA1\\uDCA3\\uDCA4\\uDCA7\\uDCA8\\uDCAD\\uDCBA\\uDCBC\\uDCC4\\uDD06\\uDD0B\\uDD0C\\uDD15\\uDD1D\\uDD3A\\uDD3F\\uDD45\\uDD47-\\uDD49\\uDD51\\uDEA6\\uDEA7\\uDFCC\\uDFCD]|\\uD836[\\uDE8C-\\uDE9A\\uDEA0\\uDEB0-\\uDFFF]|\\uD838[\\uDC07\\uDC19\\uDC1A\\uDC22\\uDC25\\uDC2B-\\uDCFF\\uDD2D-\\uDD2F\\uDD3E\\uDD3F\\uDD4A-\\uDD4D\\uDD50-\\uDEBF\\uDEFA-\\uDEFE\\uDF00-\\uDFFF]|\\uD83A[\\uDCC5\\uDCC6\\uDCD7-\\uDCFF\\uDD4C-\\uDD4F\\uDD5A-\\uDD5D\\uDD60-\\uDFFF]|\\uD83B[\\uDC00-\\uDC70\\uDCB5-\\uDD00\\uDD3E-\\uDDFF\\uDE04\\uDE20\\uDE23\\uDE25\\uDE26\\uDE28\\uDE33\\uDE38\\uDE3A\\uDE3C-\\uDE41\\uDE43-\\uDE46\\uDE48\\uDE4A\\uDE4C\\uDE50\\uDE53\\uDE55\\uDE56\\uDE58\\uDE5A\\uDE5C\\uDE5E\\uDE60\\uDE63\\uDE65\\uDE66\\uDE6B\\uDE73\\uDE78\\uDE7D\\uDE7F\\uDE8A\\uDE9C-\\uDEA0\\uDEA4\\uDEAA\\uDEBC-\\uDEEF\\uDEF2-\\uDFFF]|\\uD83C[\\uDC2C-\\uDC2F\\uDC94-\\uDC9F\\uDCAF\\uDCB0\\uDCC0\\uDCD0\\uDCF6-\\uDCFF\\uDDAE-\\uDDE5\\uDE03-\\uDE0F\\uDE3C-\\uDE3F\\uDE49-\\uDE4F\\uDE52-\\uDE5F\\uDE66-\\uDEFF]|\\uD83D[\\uDED8-\\uDEDF\\uDEED-\\uDEEF\\uDEFD-\\uDEFF\\uDF74-\\uDF7F\\uDFD9-\\uDFDF\\uDFEC-\\uDFFF]|\\uD83E[\\uDC0C-\\uDC0F\\uDC48-\\uDC4F\\uDC5A-\\uDC5F\\uDC88-\\uDC8F\\uDCAE\\uDCAF\\uDCB2-\\uDCFF\\uDD79\\uDDCC\\uDE54-\\uDE5F\\uDE6E\\uDE6F\\uDE75-\\uDE77\\uDE7B-\\uDE7F\\uDE87-\\uDE8F\\uDEA9-\\uDEAF\\uDEB7-\\uDEBF\\uDEC3-\\uDECF\\uDED7-\\uDEFF\\uDF93\\uDFCB-\\uDFEF\\uDFFA-\\uDFFF]|\\uD869[\\uDEDE-\\uDEFF]|\\uD86D[\\uDF35-\\uDF3F]|\\uD86E[\\uDC1E\\uDC1F]|\\uD873[\\uDEA2-\\uDEAF]|\\uD87A[\\uDFE1-\\uDFFF]|\\uD87E[\\uDE1E-\\uDFFF]|\\uD884[\\uDF4B-\\uDFFF]|\\uDB40[\\uDC00-\\uDCFF\\uDDF0-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF])[\\s\\S])";
// [^\\p{Z}\\p{C}\"\\(\\)]
QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_UNQUOTED_WORDS_PART = "(?:(?![\\0- \"\\(\\)\\\\\\x7F-\\xA0\\xAD\\u0378\\u0379\\u0380-\\u0383\\u038B\\u038D\\u03A2\\u0530\\u0557\\u0558\\u058B\\u058C\\u0590\\u05C8-\\u05CF\\u05EB-\\u05EE\\u05F5-\\u0605\\u061C\\u061D\\u06DD\\u070E\\u070F\\u074B\\u074C\\u07B2-\\u07BF\\u07FB\\u07FC\\u082E\\u082F\\u083F\\u085C\\u085D\\u085F\\u086B-\\u089F\\u08B5\\u08C8-\\u08D2\\u08E2\\u0984\\u098D\\u098E\\u0991\\u0992\\u09A9\\u09B1\\u09B3-\\u09B5\\u09BA\\u09BB\\u09C5\\u09C6\\u09C9\\u09CA\\u09CF-\\u09D6\\u09D8-\\u09DB\\u09DE\\u09E4\\u09E5\\u09FF\\u0A00\\u0A04\\u0A0B-\\u0A0E\\u0A11\\u0A12\\u0A29\\u0A31\\u0A34\\u0A37\\u0A3A\\u0A3B\\u0A3D\\u0A43-\\u0A46\\u0A49\\u0A4A\\u0A4E-\\u0A50\\u0A52-\\u0A58\\u0A5D\\u0A5F-\\u0A65\\u0A77-\\u0A80\\u0A84\\u0A8E\\u0A92\\u0AA9\\u0AB1\\u0AB4\\u0ABA\\u0ABB\\u0AC6\\u0ACA\\u0ACE\\u0ACF\\u0AD1-\\u0ADF\\u0AE4\\u0AE5\\u0AF2-\\u0AF8\\u0B00\\u0B04\\u0B0D\\u0B0E\\u0B11\\u0B12\\u0B29\\u0B31\\u0B34\\u0B3A\\u0B3B\\u0B45\\u0B46\\u0B49\\u0B4A\\u0B4E-\\u0B54\\u0B58-\\u0B5B\\u0B5E\\u0B64\\u0B65\\u0B78-\\u0B81\\u0B84\\u0B8B-\\u0B8D\\u0B91\\u0B96-\\u0B98\\u0B9B\\u0B9D\\u0BA0-\\u0BA2\\u0BA5-\\u0BA7\\u0BAB-\\u0BAD\\u0BBA-\\u0BBD\\u0BC3-\\u0BC5\\u0BC9\\u0BCE\\u0BCF\\u0BD1-\\u0BD6\\u0BD8-\\u0BE5\\u0BFB-\\u0BFF\\u0C0D\\u0C11\\u0C29\\u0C3A-\\u0C3C\\u0C45\\u0C49\\u0C4E-\\u0C54\\u0C57\\u0C5B-\\u0C5F\\u0C64\\u0C65\\u0C70-\\u0C76\\u0C8D\\u0C91\\u0CA9\\u0CB4\\u0CBA\\u0CBB\\u0CC5\\u0CC9\\u0CCE-\\u0CD4\\u0CD7-\\u0CDD\\u0CDF\\u0CE4\\u0CE5\\u0CF0\\u0CF3-\\u0CFF\\u0D0D\\u0D11\\u0D45\\u0D49\\u0D50-\\u0D53\\u0D64\\u0D65\\u0D80\\u0D84\\u0D97-\\u0D99\\u0DB2\\u0DBC\\u0DBE\\u0DBF\\u0DC7-\\u0DC9\\u0DCB-\\u0DCE\\u0DD5\\u0DD7\\u0DE0-\\u0DE5\\u0DF0\\u0DF1\\u0DF5-\\u0E00\\u0E3B-\\u0E3E\\u0E5C-\\u0E80\\u0E83\\u0E85\\u0E8B\\u0EA4\\u0EA6\\u0EBE\\u0EBF\\u0EC5\\u0EC7\\u0ECE\\u0ECF\\u0EDA\\u0EDB\\u0EE0-\\u0EFF\\u0F48\\u0F6D-\\u0F70\\u0F98\\u0FBD\\u0FCD\\u0FDB-\\u0FFF\\u10C6\\u10C8-\\u10CC\\u10CE\\u10CF\\u1249\\u124E\\u124F\\u1257\\u1259\\u125E\\u125F\\u1289\\u128E\\u128F\\u12B1\\u12B6\\u12B7\\u12BF\\u12C1\\u12C6\\u12C7\\u12D7\\u1311\\u1316\\u1317\\u135B\\u135C\\u137D-\\u137F\\u139A-\\u139F\\u13F6\\u13F7\\u13FE\\u13FF\\u1680\\u169D-\\u169F\\u16F9-\\u16FF\\u170D\\u1715-\\u171F\\u1737-\\u173F\\u1754-\\u175F\\u176D\\u1771\\u1774-\\u177F\\u17DE\\u17DF\\u17EA-\\u17EF\\u17FA-\\u17FF\\u180E\\u180F\\u181A-\\u181F\\u1879-\\u187F\\u18AB-\\u18AF\\u18F6-\\u18FF\\u191F\\u192C-\\u192F\\u193C-\\u193F\\u1941-\\u1943\\u196E\\u196F\\u1975-\\u197F\\u19AC-\\u19AF\\u19CA-\\u19CF\\u19DB-\\u19DD\\u1A1C\\u1A1D\\u1A5F\\u1A7D\\u1A7E\\u1A8A-\\u1A8F\\u1A9A-\\u1A9F\\u1AAE\\u1AAF\\u1AC1-\\u1AFF\\u1B4C-\\u1B4F\\u1B7D-\\u1B7F\\u1BF4-\\u1BFB\\u1C38-\\u1C3A\\u1C4A-\\u1C4C\\u1C89-\\u1C8F\\u1CBB\\u1CBC\\u1CC8-\\u1CCF\\u1CFB-\\u1CFF\\u1DFA\\u1F16\\u1F17\\u1F1E\\u1F1F\\u1F46\\u1F47\\u1F4E\\u1F4F\\u1F58\\u1F5A\\u1F5C\\u1F5E\\u1F7E\\u1F7F\\u1FB5\\u1FC5\\u1FD4\\u1FD5\\u1FDC\\u1FF0\\u1FF1\\u1FF5\\u1FFF-\\u200F\\u2028-\\u202F\\u205F-\\u206F\\u2072\\u2073\\u208F\\u209D-\\u209F\\u20C0-\\u20CF\\u20F1-\\u20FF\\u218C-\\u218F\\u2427-\\u243F\\u244B-\\u245F\\u2B74\\u2B75\\u2B96\\u2C2F\\u2C5F\\u2CF4-\\u2CF8\\u2D26\\u2D28-\\u2D2C\\u2D2E\\u2D2F\\u2D68-\\u2D6E\\u2D71-\\u2D7E\\u2D97-\\u2D9F\\u2DA7\\u2DAF\\u2DB7\\u2DBF\\u2DC7\\u2DCF\\u2DD7\\u2DDF\\u2E53-\\u2E7F\\u2E9A\\u2EF4-\\u2EFF\\u2FD6-\\u2FEF\\u2FFC-\\u3000\\u3040\\u3097\\u3098\\u3100-\\u3104\\u3130\\u318F\\u31E4-\\u31EF\\u321F\\u9FFD-\\u9FFF\\uA48D-\\uA48F\\uA4C7-\\uA4CF\\uA62C-\\uA63F\\uA6F8-\\uA6FF\\uA7C0\\uA7C1\\uA7CB-\\uA7F4\\uA82D-\\uA82F\\uA83A-\\uA83F\\uA878-\\uA87F\\uA8C6-\\uA8CD\\uA8DA-\\uA8DF\\uA954-\\uA95E\\uA97D-\\uA97F\\uA9CE\\uA9DA-\\uA9DD\\uA9FF\\uAA37-\\uAA3F\\uAA4E\\uAA4F\\uAA5A\\uAA5B\\uAAC3-\\uAADA\\uAAF7-\\uAB00\\uAB07\\uAB08\\uAB0F\\uAB10\\uAB17-\\uAB1F\\uAB27\\uAB2F\\uAB6C-\\uAB6F\\uABEE\\uABEF\\uABFA-\\uABFF\\uD7A4-\\uD7AF\\uD7C7-\\uD7CA\\uD7FC-\\uD7FF\\uE000-\\uF8FF\\uFA6E\\uFA6F\\uFADA-\\uFAFF\\uFB07-\\uFB12\\uFB18-\\uFB1C\\uFB37\\uFB3D\\uFB3F\\uFB42\\uFB45\\uFBC2-\\uFBD2\\uFD40-\\uFD4F\\uFD90\\uFD91\\uFDC8-\\uFDEF\\uFDFE\\uFDFF\\uFE1A-\\uFE1F\\uFE53\\uFE67\\uFE6C-\\uFE6F\\uFE75\\uFEFD-\\uFF00\\uFFBF-\\uFFC1\\uFFC8\\uFFC9\\uFFD0\\uFFD1\\uFFD8\\uFFD9\\uFFDD-\\uFFDF\\uFFE7\\uFFEF-\\uFFFB\\uFFFE\\uFFFF]|\\uD800[\\uDC0C\\uDC27\\uDC3B\\uDC3E\\uDC4E\\uDC4F\\uDC5E-\\uDC7F\\uDCFB-\\uDCFF\\uDD03-\\uDD06\\uDD34-\\uDD36\\uDD8F\\uDD9D-\\uDD9F\\uDDA1-\\uDDCF\\uDDFE-\\uDE7F\\uDE9D-\\uDE9F\\uDED1-\\uDEDF\\uDEFC-\\uDEFF\\uDF24-\\uDF2C\\uDF4B-\\uDF4F\\uDF7B-\\uDF7F\\uDF9E\\uDFC4-\\uDFC7\\uDFD6-\\uDFFF]|\\uD801[\\uDC9E\\uDC9F\\uDCAA-\\uDCAF\\uDCD4-\\uDCD7\\uDCFC-\\uDCFF\\uDD28-\\uDD2F\\uDD64-\\uDD6E\\uDD70-\\uDDFF\\uDF37-\\uDF3F\\uDF56-\\uDF5F\\uDF68-\\uDFFF]|\\uD802[\\uDC06\\uDC07\\uDC09\\uDC36\\uDC39-\\uDC3B\\uDC3D\\uDC3E\\uDC56\\uDC9F-\\uDCA6\\uDCB0-\\uDCDF\\uDCF3\\uDCF6-\\uDCFA\\uDD1C-\\uDD1E\\uDD3A-\\uDD3E\\uDD40-\\uDD7F\\uDDB8-\\uDDBB\\uDDD0\\uDDD1\\uDE04\\uDE07-\\uDE0B\\uDE14\\uDE18\\uDE36\\uDE37\\uDE3B-\\uDE3E\\uDE49-\\uDE4F\\uDE59-\\uDE5F\\uDEA0-\\uDEBF\\uDEE7-\\uDEEA\\uDEF7-\\uDEFF\\uDF36-\\uDF38\\uDF56\\uDF57\\uDF73-\\uDF77\\uDF92-\\uDF98\\uDF9D-\\uDFA8\\uDFB0-\\uDFFF]|\\uD803[\\uDC49-\\uDC7F\\uDCB3-\\uDCBF\\uDCF3-\\uDCF9\\uDD28-\\uDD2F\\uDD3A-\\uDE5F\\uDE7F\\uDEAA\\uDEAE\\uDEAF\\uDEB2-\\uDEFF\\uDF28-\\uDF2F\\uDF5A-\\uDFAF\\uDFCC-\\uDFDF\\uDFF7-\\uDFFF]|\\uD804[\\uDC4E-\\uDC51\\uDC70-\\uDC7E\\uDCBD\\uDCC2-\\uDCCF\\uDCE9-\\uDCEF\\uDCFA-\\uDCFF\\uDD35\\uDD48-\\uDD4F\\uDD77-\\uDD7F\\uDDE0\\uDDF5-\\uDDFF\\uDE12\\uDE3F-\\uDE7F\\uDE87\\uDE89\\uDE8E\\uDE9E\\uDEAA-\\uDEAF\\uDEEB-\\uDEEF\\uDEFA-\\uDEFF\\uDF04\\uDF0D\\uDF0E\\uDF11\\uDF12\\uDF29\\uDF31\\uDF34\\uDF3A\\uDF45\\uDF46\\uDF49\\uDF4A\\uDF4E\\uDF4F\\uDF51-\\uDF56\\uDF58-\\uDF5C\\uDF64\\uDF65\\uDF6D-\\uDF6F\\uDF75-\\uDFFF]|\\uD805[\\uDC5C\\uDC62-\\uDC7F\\uDCC8-\\uDCCF\\uDCDA-\\uDD7F\\uDDB6\\uDDB7\\uDDDE-\\uDDFF\\uDE45-\\uDE4F\\uDE5A-\\uDE5F\\uDE6D-\\uDE7F\\uDEB9-\\uDEBF\\uDECA-\\uDEFF\\uDF1B\\uDF1C\\uDF2C-\\uDF2F\\uDF40-\\uDFFF]|\\uD806[\\uDC3C-\\uDC9F\\uDCF3-\\uDCFE\\uDD07\\uDD08\\uDD0A\\uDD0B\\uDD14\\uDD17\\uDD36\\uDD39\\uDD3A\\uDD47-\\uDD4F\\uDD5A-\\uDD9F\\uDDA8\\uDDA9\\uDDD8\\uDDD9\\uDDE5-\\uDDFF\\uDE48-\\uDE4F\\uDEA3-\\uDEBF\\uDEF9-\\uDFFF]|\\uD807[\\uDC09\\uDC37\\uDC46-\\uDC4F\\uDC6D-\\uDC6F\\uDC90\\uDC91\\uDCA8\\uDCB7-\\uDCFF\\uDD07\\uDD0A\\uDD37-\\uDD39\\uDD3B\\uDD3E\\uDD48-\\uDD4F\\uDD5A-\\uDD5F\\uDD66\\uDD69\\uDD8F\\uDD92\\uDD99-\\uDD9F\\uDDAA-\\uDEDF\\uDEF9-\\uDFAF\\uDFB1-\\uDFBF\\uDFF2-\\uDFFE]|\\uD808[\\uDF9A-\\uDFFF]|\\uD809[\\uDC6F\\uDC75-\\uDC7F\\uDD44-\\uDFFF]|[\\uD80A\\uD80B\\uD80E-\\uD810\\uD812-\\uD819\\uD824-\\uD82B\\uD82D\\uD82E\\uD830-\\uD833\\uD837\\uD839\\uD83F\\uD87B-\\uD87D\\uD87F\\uD885-\\uDB3F\\uDB41-\\uDBFF][\\uDC00-\\uDFFF]|\\uD80D[\\uDC2F-\\uDFFF]|\\uD811[\\uDE47-\\uDFFF]|\\uD81A[\\uDE39-\\uDE3F\\uDE5F\\uDE6A-\\uDE6D\\uDE70-\\uDECF\\uDEEE\\uDEEF\\uDEF6-\\uDEFF\\uDF46-\\uDF4F\\uDF5A\\uDF62\\uDF78-\\uDF7C\\uDF90-\\uDFFF]|\\uD81B[\\uDC00-\\uDE3F\\uDE9B-\\uDEFF\\uDF4B-\\uDF4E\\uDF88-\\uDF8E\\uDFA0-\\uDFDF\\uDFE5-\\uDFEF\\uDFF2-\\uDFFF]|\\uD821[\\uDFF8-\\uDFFF]|\\uD823[\\uDCD6-\\uDCFF\\uDD09-\\uDFFF]|\\uD82C[\\uDD1F-\\uDD4F\\uDD53-\\uDD63\\uDD68-\\uDD6F\\uDEFC-\\uDFFF]|\\uD82F[\\uDC6B-\\uDC6F\\uDC7D-\\uDC7F\\uDC89-\\uDC8F\\uDC9A\\uDC9B\\uDCA0-\\uDFFF]|\\uD834[\\uDCF6-\\uDCFF\\uDD27\\uDD28\\uDD73-\\uDD7A\\uDDE9-\\uDDFF\\uDE46-\\uDEDF\\uDEF4-\\uDEFF\\uDF57-\\uDF5F\\uDF79-\\uDFFF]|\\uD835[\\uDC55\\uDC9D\\uDCA0\\uDCA1\\uDCA3\\uDCA4\\uDCA7\\uDCA8\\uDCAD\\uDCBA\\uDCBC\\uDCC4\\uDD06\\uDD0B\\uDD0C\\uDD15\\uDD1D\\uDD3A\\uDD3F\\uDD45\\uDD47-\\uDD49\\uDD51\\uDEA6\\uDEA7\\uDFCC\\uDFCD]|\\uD836[\\uDE8C-\\uDE9A\\uDEA0\\uDEB0-\\uDFFF]|\\uD838[\\uDC07\\uDC19\\uDC1A\\uDC22\\uDC25\\uDC2B-\\uDCFF\\uDD2D-\\uDD2F\\uDD3E\\uDD3F\\uDD4A-\\uDD4D\\uDD50-\\uDEBF\\uDEFA-\\uDEFE\\uDF00-\\uDFFF]|\\uD83A[\\uDCC5\\uDCC6\\uDCD7-\\uDCFF\\uDD4C-\\uDD4F\\uDD5A-\\uDD5D\\uDD60-\\uDFFF]|\\uD83B[\\uDC00-\\uDC70\\uDCB5-\\uDD00\\uDD3E-\\uDDFF\\uDE04\\uDE20\\uDE23\\uDE25\\uDE26\\uDE28\\uDE33\\uDE38\\uDE3A\\uDE3C-\\uDE41\\uDE43-\\uDE46\\uDE48\\uDE4A\\uDE4C\\uDE50\\uDE53\\uDE55\\uDE56\\uDE58\\uDE5A\\uDE5C\\uDE5E\\uDE60\\uDE63\\uDE65\\uDE66\\uDE6B\\uDE73\\uDE78\\uDE7D\\uDE7F\\uDE8A\\uDE9C-\\uDEA0\\uDEA4\\uDEAA\\uDEBC-\\uDEEF\\uDEF2-\\uDFFF]|\\uD83C[\\uDC2C-\\uDC2F\\uDC94-\\uDC9F\\uDCAF\\uDCB0\\uDCC0\\uDCD0\\uDCF6-\\uDCFF\\uDDAE-\\uDDE5\\uDE03-\\uDE0F\\uDE3C-\\uDE3F\\uDE49-\\uDE4F\\uDE52-\\uDE5F\\uDE66-\\uDEFF]|\\uD83D[\\uDED8-\\uDEDF\\uDEED-\\uDEEF\\uDEFD-\\uDEFF\\uDF74-\\uDF7F\\uDFD9-\\uDFDF\\uDFEC-\\uDFFF]|\\uD83E[\\uDC0C-\\uDC0F\\uDC48-\\uDC4F\\uDC5A-\\uDC5F\\uDC88-\\uDC8F\\uDCAE\\uDCAF\\uDCB2-\\uDCFF\\uDD79\\uDDCC\\uDE54-\\uDE5F\\uDE6E\\uDE6F\\uDE75-\\uDE77\\uDE7B-\\uDE7F\\uDE87-\\uDE8F\\uDEA9-\\uDEAF\\uDEB7-\\uDEBF\\uDEC3-\\uDECF\\uDED7-\\uDEFF\\uDF93\\uDFCB-\\uDFEF\\uDFFA-\\uDFFF]|\\uD869[\\uDEDE-\\uDEFF]|\\uD86D[\\uDF35-\\uDF3F]|\\uD86E[\\uDC1E\\uDC1F]|\\uD873[\\uDEA2-\\uDEAF]|\\uD87A[\\uDFE1-\\uDFFF]|\\uD87E[\\uDE1E-\\uDFFF]|\\uD884[\\uDF4B-\\uDFFF]|\\uDB40[\\uDC00-\\uDCFF\\uDDF0-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF])[\\s\\S])";
// [^\\p{Z}\\p{C}\"]
QueryStringParser.SEARCH_WORD_WITH_PAREN_FIELD_OPERATOR_WITH_UNQUOTED_WORDS_PART = "(?:(?![\\0- \"\\x7F-\\xA0\\xAD\\u0378\\u0379\\u0380-\\u0383\\u038B\\u038D\\u03A2\\u0530\\u0557\\u0558\\u058B\\u058C\\u0590\\u05C8-\\u05CF\\u05EB-\\u05EE\\u05F5-\\u0605\\u061C\\u061D\\u06DD\\u070E\\u070F\\u074B\\u074C\\u07B2-\\u07BF\\u07FB\\u07FC\\u082E\\u082F\\u083F\\u085C\\u085D\\u085F\\u086B-\\u089F\\u08B5\\u08C8-\\u08D2\\u08E2\\u0984\\u098D\\u098E\\u0991\\u0992\\u09A9\\u09B1\\u09B3-\\u09B5\\u09BA\\u09BB\\u09C5\\u09C6\\u09C9\\u09CA\\u09CF-\\u09D6\\u09D8-\\u09DB\\u09DE\\u09E4\\u09E5\\u09FF\\u0A00\\u0A04\\u0A0B-\\u0A0E\\u0A11\\u0A12\\u0A29\\u0A31\\u0A34\\u0A37\\u0A3A\\u0A3B\\u0A3D\\u0A43-\\u0A46\\u0A49\\u0A4A\\u0A4E-\\u0A50\\u0A52-\\u0A58\\u0A5D\\u0A5F-\\u0A65\\u0A77-\\u0A80\\u0A84\\u0A8E\\u0A92\\u0AA9\\u0AB1\\u0AB4\\u0ABA\\u0ABB\\u0AC6\\u0ACA\\u0ACE\\u0ACF\\u0AD1-\\u0ADF\\u0AE4\\u0AE5\\u0AF2-\\u0AF8\\u0B00\\u0B04\\u0B0D\\u0B0E\\u0B11\\u0B12\\u0B29\\u0B31\\u0B34\\u0B3A\\u0B3B\\u0B45\\u0B46\\u0B49\\u0B4A\\u0B4E-\\u0B54\\u0B58-\\u0B5B\\u0B5E\\u0B64\\u0B65\\u0B78-\\u0B81\\u0B84\\u0B8B-\\u0B8D\\u0B91\\u0B96-\\u0B98\\u0B9B\\u0B9D\\u0BA0-\\u0BA2\\u0BA5-\\u0BA7\\u0BAB-\\u0BAD\\u0BBA-\\u0BBD\\u0BC3-\\u0BC5\\u0BC9\\u0BCE\\u0BCF\\u0BD1-\\u0BD6\\u0BD8-\\u0BE5\\u0BFB-\\u0BFF\\u0C0D\\u0C11\\u0C29\\u0C3A-\\u0C3C\\u0C45\\u0C49\\u0C4E-\\u0C54\\u0C57\\u0C5B-\\u0C5F\\u0C64\\u0C65\\u0C70-\\u0C76\\u0C8D\\u0C91\\u0CA9\\u0CB4\\u0CBA\\u0CBB\\u0CC5\\u0CC9\\u0CCE-\\u0CD4\\u0CD7-\\u0CDD\\u0CDF\\u0CE4\\u0CE5\\u0CF0\\u0CF3-\\u0CFF\\u0D0D\\u0D11\\u0D45\\u0D49\\u0D50-\\u0D53\\u0D64\\u0D65\\u0D80\\u0D84\\u0D97-\\u0D99\\u0DB2\\u0DBC\\u0DBE\\u0DBF\\u0DC7-\\u0DC9\\u0DCB-\\u0DCE\\u0DD5\\u0DD7\\u0DE0-\\u0DE5\\u0DF0\\u0DF1\\u0DF5-\\u0E00\\u0E3B-\\u0E3E\\u0E5C-\\u0E80\\u0E83\\u0E85\\u0E8B\\u0EA4\\u0EA6\\u0EBE\\u0EBF\\u0EC5\\u0EC7\\u0ECE\\u0ECF\\u0EDA\\u0EDB\\u0EE0-\\u0EFF\\u0F48\\u0F6D-\\u0F70\\u0F98\\u0FBD\\u0FCD\\u0FDB-\\u0FFF\\u10C6\\u10C8-\\u10CC\\u10CE\\u10CF\\u1249\\u124E\\u124F\\u1257\\u1259\\u125E\\u125F\\u1289\\u128E\\u128F\\u12B1\\u12B6\\u12B7\\u12BF\\u12C1\\u12C6\\u12C7\\u12D7\\u1311\\u1316\\u1317\\u135B\\u135C\\u137D-\\u137F\\u139A-\\u139F\\u13F6\\u13F7\\u13FE\\u13FF\\u1680\\u169D-\\u169F\\u16F9-\\u16FF\\u170D\\u1715-\\u171F\\u1737-\\u173F\\u1754-\\u175F\\u176D\\u1771\\u1774-\\u177F\\u17DE\\u17DF\\u17EA-\\u17EF\\u17FA-\\u17FF\\u180E\\u180F\\u181A-\\u181F\\u1879-\\u187F\\u18AB-\\u18AF\\u18F6-\\u18FF\\u191F\\u192C-\\u192F\\u193C-\\u193F\\u1941-\\u1943\\u196E\\u196F\\u1975-\\u197F\\u19AC-\\u19AF\\u19CA-\\u19CF\\u19DB-\\u19DD\\u1A1C\\u1A1D\\u1A5F\\u1A7D\\u1A7E\\u1A8A-\\u1A8F\\u1A9A-\\u1A9F\\u1AAE\\u1AAF\\u1AC1-\\u1AFF\\u1B4C-\\u1B4F\\u1B7D-\\u1B7F\\u1BF4-\\u1BFB\\u1C38-\\u1C3A\\u1C4A-\\u1C4C\\u1C89-\\u1C8F\\u1CBB\\u1CBC\\u1CC8-\\u1CCF\\u1CFB-\\u1CFF\\u1DFA\\u1F16\\u1F17\\u1F1E\\u1F1F\\u1F46\\u1F47\\u1F4E\\u1F4F\\u1F58\\u1F5A\\u1F5C\\u1F5E\\u1F7E\\u1F7F\\u1FB5\\u1FC5\\u1FD4\\u1FD5\\u1FDC\\u1FF0\\u1FF1\\u1FF5\\u1FFF-\\u200F\\u2028-\\u202F\\u205F-\\u206F\\u2072\\u2073\\u208F\\u209D-\\u209F\\u20C0-\\u20CF\\u20F1-\\u20FF\\u218C-\\u218F\\u2427-\\u243F\\u244B-\\u245F\\u2B74\\u2B75\\u2B96\\u2C2F\\u2C5F\\u2CF4-\\u2CF8\\u2D26\\u2D28-\\u2D2C\\u2D2E\\u2D2F\\u2D68-\\u2D6E\\u2D71-\\u2D7E\\u2D97-\\u2D9F\\u2DA7\\u2DAF\\u2DB7\\u2DBF\\u2DC7\\u2DCF\\u2DD7\\u2DDF\\u2E53-\\u2E7F\\u2E9A\\u2EF4-\\u2EFF\\u2FD6-\\u2FEF\\u2FFC-\\u3000\\u3040\\u3097\\u3098\\u3100-\\u3104\\u3130\\u318F\\u31E4-\\u31EF\\u321F\\u9FFD-\\u9FFF\\uA48D-\\uA48F\\uA4C7-\\uA4CF\\uA62C-\\uA63F\\uA6F8-\\uA6FF\\uA7C0\\uA7C1\\uA7CB-\\uA7F4\\uA82D-\\uA82F\\uA83A-\\uA83F\\uA878-\\uA87F\\uA8C6-\\uA8CD\\uA8DA-\\uA8DF\\uA954-\\uA95E\\uA97D-\\uA97F\\uA9CE\\uA9DA-\\uA9DD\\uA9FF\\uAA37-\\uAA3F\\uAA4E\\uAA4F\\uAA5A\\uAA5B\\uAAC3-\\uAADA\\uAAF7-\\uAB00\\uAB07\\uAB08\\uAB0F\\uAB10\\uAB17-\\uAB1F\\uAB27\\uAB2F\\uAB6C-\\uAB6F\\uABEE\\uABEF\\uABFA-\\uABFF\\uD7A4-\\uD7AF\\uD7C7-\\uD7CA\\uD7FC-\\uD7FF\\uE000-\\uF8FF\\uFA6E\\uFA6F\\uFADA-\\uFAFF\\uFB07-\\uFB12\\uFB18-\\uFB1C\\uFB37\\uFB3D\\uFB3F\\uFB42\\uFB45\\uFBC2-\\uFBD2\\uFD40-\\uFD4F\\uFD90\\uFD91\\uFDC8-\\uFDEF\\uFDFE\\uFDFF\\uFE1A-\\uFE1F\\uFE53\\uFE67\\uFE6C-\\uFE6F\\uFE75\\uFEFD-\\uFF00\\uFFBF-\\uFFC1\\uFFC8\\uFFC9\\uFFD0\\uFFD1\\uFFD8\\uFFD9\\uFFDD-\\uFFDF\\uFFE7\\uFFEF-\\uFFFB\\uFFFE\\uFFFF]|\\uD800[\\uDC0C\\uDC27\\uDC3B\\uDC3E\\uDC4E\\uDC4F\\uDC5E-\\uDC7F\\uDCFB-\\uDCFF\\uDD03-\\uDD06\\uDD34-\\uDD36\\uDD8F\\uDD9D-\\uDD9F\\uDDA1-\\uDDCF\\uDDFE-\\uDE7F\\uDE9D-\\uDE9F\\uDED1-\\uDEDF\\uDEFC-\\uDEFF\\uDF24-\\uDF2C\\uDF4B-\\uDF4F\\uDF7B-\\uDF7F\\uDF9E\\uDFC4-\\uDFC7\\uDFD6-\\uDFFF]|\\uD801[\\uDC9E\\uDC9F\\uDCAA-\\uDCAF\\uDCD4-\\uDCD7\\uDCFC-\\uDCFF\\uDD28-\\uDD2F\\uDD64-\\uDD6E\\uDD70-\\uDDFF\\uDF37-\\uDF3F\\uDF56-\\uDF5F\\uDF68-\\uDFFF]|\\uD802[\\uDC06\\uDC07\\uDC09\\uDC36\\uDC39-\\uDC3B\\uDC3D\\uDC3E\\uDC56\\uDC9F-\\uDCA6\\uDCB0-\\uDCDF\\uDCF3\\uDCF6-\\uDCFA\\uDD1C-\\uDD1E\\uDD3A-\\uDD3E\\uDD40-\\uDD7F\\uDDB8-\\uDDBB\\uDDD0\\uDDD1\\uDE04\\uDE07-\\uDE0B\\uDE14\\uDE18\\uDE36\\uDE37\\uDE3B-\\uDE3E\\uDE49-\\uDE4F\\uDE59-\\uDE5F\\uDEA0-\\uDEBF\\uDEE7-\\uDEEA\\uDEF7-\\uDEFF\\uDF36-\\uDF38\\uDF56\\uDF57\\uDF73-\\uDF77\\uDF92-\\uDF98\\uDF9D-\\uDFA8\\uDFB0-\\uDFFF]|\\uD803[\\uDC49-\\uDC7F\\uDCB3-\\uDCBF\\uDCF3-\\uDCF9\\uDD28-\\uDD2F\\uDD3A-\\uDE5F\\uDE7F\\uDEAA\\uDEAE\\uDEAF\\uDEB2-\\uDEFF\\uDF28-\\uDF2F\\uDF5A-\\uDFAF\\uDFCC-\\uDFDF\\uDFF7-\\uDFFF]|\\uD804[\\uDC4E-\\uDC51\\uDC70-\\uDC7E\\uDCBD\\uDCC2-\\uDCCF\\uDCE9-\\uDCEF\\uDCFA-\\uDCFF\\uDD35\\uDD48-\\uDD4F\\uDD77-\\uDD7F\\uDDE0\\uDDF5-\\uDDFF\\uDE12\\uDE3F-\\uDE7F\\uDE87\\uDE89\\uDE8E\\uDE9E\\uDEAA-\\uDEAF\\uDEEB-\\uDEEF\\uDEFA-\\uDEFF\\uDF04\\uDF0D\\uDF0E\\uDF11\\uDF12\\uDF29\\uDF31\\uDF34\\uDF3A\\uDF45\\uDF46\\uDF49\\uDF4A\\uDF4E\\uDF4F\\uDF51-\\uDF56\\uDF58-\\uDF5C\\uDF64\\uDF65\\uDF6D-\\uDF6F\\uDF75-\\uDFFF]|\\uD805[\\uDC5C\\uDC62-\\uDC7F\\uDCC8-\\uDCCF\\uDCDA-\\uDD7F\\uDDB6\\uDDB7\\uDDDE-\\uDDFF\\uDE45-\\uDE4F\\uDE5A-\\uDE5F\\uDE6D-\\uDE7F\\uDEB9-\\uDEBF\\uDECA-\\uDEFF\\uDF1B\\uDF1C\\uDF2C-\\uDF2F\\uDF40-\\uDFFF]|\\uD806[\\uDC3C-\\uDC9F\\uDCF3-\\uDCFE\\uDD07\\uDD08\\uDD0A\\uDD0B\\uDD14\\uDD17\\uDD36\\uDD39\\uDD3A\\uDD47-\\uDD4F\\uDD5A-\\uDD9F\\uDDA8\\uDDA9\\uDDD8\\uDDD9\\uDDE5-\\uDDFF\\uDE48-\\uDE4F\\uDEA3-\\uDEBF\\uDEF9-\\uDFFF]|\\uD807[\\uDC09\\uDC37\\uDC46-\\uDC4F\\uDC6D-\\uDC6F\\uDC90\\uDC91\\uDCA8\\uDCB7-\\uDCFF\\uDD07\\uDD0A\\uDD37-\\uDD39\\uDD3B\\uDD3E\\uDD48-\\uDD4F\\uDD5A-\\uDD5F\\uDD66\\uDD69\\uDD8F\\uDD92\\uDD99-\\uDD9F\\uDDAA-\\uDEDF\\uDEF9-\\uDFAF\\uDFB1-\\uDFBF\\uDFF2-\\uDFFE]|\\uD808[\\uDF9A-\\uDFFF]|\\uD809[\\uDC6F\\uDC75-\\uDC7F\\uDD44-\\uDFFF]|[\\uD80A\\uD80B\\uD80E-\\uD810\\uD812-\\uD819\\uD824-\\uD82B\\uD82D\\uD82E\\uD830-\\uD833\\uD837\\uD839\\uD83F\\uD87B-\\uD87D\\uD87F\\uD885-\\uDB3F\\uDB41-\\uDBFF][\\uDC00-\\uDFFF]|\\uD80D[\\uDC2F-\\uDFFF]|\\uD811[\\uDE47-\\uDFFF]|\\uD81A[\\uDE39-\\uDE3F\\uDE5F\\uDE6A-\\uDE6D\\uDE70-\\uDECF\\uDEEE\\uDEEF\\uDEF6-\\uDEFF\\uDF46-\\uDF4F\\uDF5A\\uDF62\\uDF78-\\uDF7C\\uDF90-\\uDFFF]|\\uD81B[\\uDC00-\\uDE3F\\uDE9B-\\uDEFF\\uDF4B-\\uDF4E\\uDF88-\\uDF8E\\uDFA0-\\uDFDF\\uDFE5-\\uDFEF\\uDFF2-\\uDFFF]|\\uD821[\\uDFF8-\\uDFFF]|\\uD823[\\uDCD6-\\uDCFF\\uDD09-\\uDFFF]|\\uD82C[\\uDD1F-\\uDD4F\\uDD53-\\uDD63\\uDD68-\\uDD6F\\uDEFC-\\uDFFF]|\\uD82F[\\uDC6B-\\uDC6F\\uDC7D-\\uDC7F\\uDC89-\\uDC8F\\uDC9A\\uDC9B\\uDCA0-\\uDFFF]|\\uD834[\\uDCF6-\\uDCFF\\uDD27\\uDD28\\uDD73-\\uDD7A\\uDDE9-\\uDDFF\\uDE46-\\uDEDF\\uDEF4-\\uDEFF\\uDF57-\\uDF5F\\uDF79-\\uDFFF]|\\uD835[\\uDC55\\uDC9D\\uDCA0\\uDCA1\\uDCA3\\uDCA4\\uDCA7\\uDCA8\\uDCAD\\uDCBA\\uDCBC\\uDCC4\\uDD06\\uDD0B\\uDD0C\\uDD15\\uDD1D\\uDD3A\\uDD3F\\uDD45\\uDD47-\\uDD49\\uDD51\\uDEA6\\uDEA7\\uDFCC\\uDFCD]|\\uD836[\\uDE8C-\\uDE9A\\uDEA0\\uDEB0-\\uDFFF]|\\uD838[\\uDC07\\uDC19\\uDC1A\\uDC22\\uDC25\\uDC2B-\\uDCFF\\uDD2D-\\uDD2F\\uDD3E\\uDD3F\\uDD4A-\\uDD4D\\uDD50-\\uDEBF\\uDEFA-\\uDEFE\\uDF00-\\uDFFF]|\\uD83A[\\uDCC5\\uDCC6\\uDCD7-\\uDCFF\\uDD4C-\\uDD4F\\uDD5A-\\uDD5D\\uDD60-\\uDFFF]|\\uD83B[\\uDC00-\\uDC70\\uDCB5-\\uDD00\\uDD3E-\\uDDFF\\uDE04\\uDE20\\uDE23\\uDE25\\uDE26\\uDE28\\uDE33\\uDE38\\uDE3A\\uDE3C-\\uDE41\\uDE43-\\uDE46\\uDE48\\uDE4A\\uDE4C\\uDE50\\uDE53\\uDE55\\uDE56\\uDE58\\uDE5A\\uDE5C\\uDE5E\\uDE60\\uDE63\\uDE65\\uDE66\\uDE6B\\uDE73\\uDE78\\uDE7D\\uDE7F\\uDE8A\\uDE9C-\\uDEA0\\uDEA4\\uDEAA\\uDEBC-\\uDEEF\\uDEF2-\\uDFFF]|\\uD83C[\\uDC2C-\\uDC2F\\uDC94-\\uDC9F\\uDCAF\\uDCB0\\uDCC0\\uDCD0\\uDCF6-\\uDCFF\\uDDAE-\\uDDE5\\uDE03-\\uDE0F\\uDE3C-\\uDE3F\\uDE49-\\uDE4F\\uDE52-\\uDE5F\\uDE66-\\uDEFF]|\\uD83D[\\uDED8-\\uDEDF\\uDEED-\\uDEEF\\uDEFD-\\uDEFF\\uDF74-\\uDF7F\\uDFD9-\\uDFDF\\uDFEC-\\uDFFF]|\\uD83E[\\uDC0C-\\uDC0F\\uDC48-\\uDC4F\\uDC5A-\\uDC5F\\uDC88-\\uDC8F\\uDCAE\\uDCAF\\uDCB2-\\uDCFF\\uDD79\\uDDCC\\uDE54-\\uDE5F\\uDE6E\\uDE6F\\uDE75-\\uDE77\\uDE7B-\\uDE7F\\uDE87-\\uDE8F\\uDEA9-\\uDEAF\\uDEB7-\\uDEBF\\uDEC3-\\uDECF\\uDED7-\\uDEFF\\uDF93\\uDFCB-\\uDFEF\\uDFFA-\\uDFFF]|\\uD869[\\uDEDE-\\uDEFF]|\\uD86D[\\uDF35-\\uDF3F]|\\uD86E[\\uDC1E\\uDC1F]|\\uD873[\\uDEA2-\\uDEAF]|\\uD87A[\\uDFE1-\\uDFFF]|\\uD87E[\\uDE1E-\\uDFFF]|\\uD884[\\uDF4B-\\uDFFF]|\\uDB40[\\uDC00-\\uDCFF\\uDDF0-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF])[\\s\\S])";
QueryStringParser.SEARCH_WORD = "("
    + "([-]?\\()" // open bracket
    + "|(\\))" // close bracket
    + "|([-]?\"((\\\\\")|[^\"])*\"?)" // words within quotes
    + "|([-]?" + QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_QUOTED_WORDS_PART + "+:(\"((\\\\\")|[^\"])*\"?))" // field operator with quoted words
    + "|([-]?" + QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_QUOTED_WORDS_PART + "+:(" + QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_UNQUOTED_WORDS_PART + "*))" // field operator with unquoted words
    + "|([-]?(" + QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_UNQUOTED_WORDS_PART + "+))" // the rest
    + ")";
// // Parentheses are a part of a token
QueryStringParser.SEARCH_WORD_WITH_PAREN = "("
    + "([-]?\"((\\\\\")|[^\"])*\"?)" // words within quotes
    + "|([-]?" + QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_QUOTED_WORDS_PART + "+:(\"((\\\\\")|[^\"])*\"?))" // field operator with quoted words
    + "|([-]?" + QueryStringParser.SEARCH_WORD_FIELD_OPERATOR_WITH_QUOTED_WORDS_PART + "+:(" + QueryStringParser.SEARCH_WORD_WITH_PAREN_FIELD_OPERATOR_WITH_UNQUOTED_WORDS_PART + "*))" // field operator with unquoted words
    + "|([-]?(" + QueryStringParser.SEARCH_WORD_WITH_PAREN_FIELD_OPERATOR_WITH_UNQUOTED_WORDS_PART + "+))" // the rest
    + ")";
QueryStringParser.ANY = "any:";
QueryStringParser.OPERATORS = new Set([QueryToken_1.QSPTokenType.NOT, QueryToken_1.QSPTokenType.AND, QueryToken_1.QSPTokenType.OR]);
// number of arguments for each operator
QueryStringParser.OPERATOR_ARGS = new Map([[QueryToken_1.QSPTokenType.NOT, 1], [QueryToken_1.QSPTokenType.AND, 2], [QueryToken_1.QSPTokenType.OR, 2]]);
QueryStringParser.ENGLISH_STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by",
    "for", "if", "in", "into", "is", "it",
    "no", "not", "of", "on", "or", "such",
    "that", "the", "their", "then", "there", "these",
    "they", "this", "to", "was", "will", "with"
]);
// Javascript does not have builtin support for unicode categories (or some of them unexpectedly fail in some browsers).
// Explicitly define the charsets used by Evernote Search.
// see also https://www.regular-expressions.info/unicode.html and https://mothereff.in/regexpu#input=var+regex+%3D+/%5Cp%7BScript_Extensions%3DGreek%7D/u%3B&unicodePropertyEscape=1
QueryStringParser.UNICODE_CJK_RANGES = '\u1100-\u11FF\u2E80-\u312F\u3130-\u31BF\u31F0-\u9FFF\uA960-\uA97F\uAC00-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF61-\uFFDC';
QueryStringParser.UNICODE_LETTER_CATEGORY_RANGES = 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC';
QueryStringParser.UNICODE_MARK_CATEGORY_RANGES = '\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F';
QueryStringParser.UNICODE_DECIMAL_DIGIT_CATEGORY_RANGES = '0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19';
// \p{L}\p{M}\p{N}
QueryStringParser.UNICODE_ALPHANUM_RANGES = QueryStringParser.UNICODE_LETTER_CATEGORY_RANGES + QueryStringParser.UNICODE_MARK_CATEGORY_RANGES + QueryStringParser.UNICODE_DECIMAL_DIGIT_CATEGORY_RANGES;
QueryStringParser.UNDERSCORE_RANGES = '\u005F\uFF3F';
QueryStringParser.SPECIAL_PUNCT_SYMBOLS = ':\\.'; // These are considered part of a latin word when they are inside, but ignored on the word boundary.
QueryStringParser.WORD_SYMBOL = QueryStringParser.UNICODE_ALPHANUM_RANGES + QueryStringParser.UNDERSCORE_RANGES + QueryStringParser.SPECIAL_PUNCT_SYMBOLS;
QueryStringParser.PUNCT_INSIDE_REGEX = new RegExp("[" + QueryStringParser.WORD_SYMBOL + "][^" + QueryStringParser.WORD_SYMBOL + "]+[" + QueryStringParser.WORD_SYMBOL + "]", "mu");
//# sourceMappingURL=QueryStringParser.js.map