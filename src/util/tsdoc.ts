import * as tsdoc from "@microsoft/tsdoc";
import * as ts from "typescript";

const defaultDeclarationKinds = [
	ts.SyntaxKind.ArrowFunction,
	ts.SyntaxKind.BindingElement,
	ts.SyntaxKind.ClassDeclaration,
	ts.SyntaxKind.ClassExpression,
	ts.SyntaxKind.Constructor,
	ts.SyntaxKind.EnumDeclaration,
	ts.SyntaxKind.EnumMember,
	ts.SyntaxKind.ExportSpecifier,
	ts.SyntaxKind.FunctionDeclaration,
	ts.SyntaxKind.FunctionExpression,
	ts.SyntaxKind.GetAccessor,
	ts.SyntaxKind.ImportClause,
	ts.SyntaxKind.ImportEqualsDeclaration,
	ts.SyntaxKind.ImportSpecifier,
	ts.SyntaxKind.InterfaceDeclaration,
	ts.SyntaxKind.JsxAttribute,
	ts.SyntaxKind.MethodDeclaration,
	ts.SyntaxKind.MethodSignature,
	ts.SyntaxKind.ModuleDeclaration,
	ts.SyntaxKind.NamespaceExportDeclaration,
	ts.SyntaxKind.NamespaceImport,
	ts.SyntaxKind.Parameter,
	ts.SyntaxKind.PropertyAssignment,
	ts.SyntaxKind.PropertyDeclaration,
	ts.SyntaxKind.PropertySignature,
	ts.SyntaxKind.SetAccessor,
	ts.SyntaxKind.ShorthandPropertyAssignment,
	ts.SyntaxKind.TypeAliasDeclaration,
	ts.SyntaxKind.TypeParameter,
	ts.SyntaxKind.VariableDeclaration,
	ts.SyntaxKind.JSDocTypedefTag,
	ts.SyntaxKind.JSDocCallbackTag,
	ts.SyntaxKind.JSDocPropertyTag,
];

/**
 * Returns true if the specified SyntaxKind is part of a declaration form.
 *
 * Based on ts.isDeclarationKind() from the compiler.
 * https://github.com/microsoft/TypeScript/blob/v3.0.3/src/compiler/utilities.ts#L6382
 */
function isDeclarationKind(kind: ts.SyntaxKind): boolean {
	return defaultDeclarationKinds.includes(kind);
}

/**
 * Retrieves the JSDoc-style comments associated with a specific AST node.
 *
 * Based on ts.getJSDocCommentRanges() from the compiler.
 * https://github.com/microsoft/TypeScript/blob/v3.0.3/src/compiler/utilities.ts#L924
 */
function getJSDocCommentRanges(node: ts.Node, text: string): ts.CommentRange[] {
	const commentRanges: ts.CommentRange[] = [];

	switch (node.kind) {
		case ts.SyntaxKind.Parameter:
		case ts.SyntaxKind.TypeParameter:
		case ts.SyntaxKind.FunctionExpression:
		case ts.SyntaxKind.ArrowFunction:
		case ts.SyntaxKind.ParenthesizedExpression:
			commentRanges.push(
				...(ts.getTrailingCommentRanges(text, node.pos) || []),
			);
			break;
	}
	commentRanges.push(...(ts.getLeadingCommentRanges(text, node.pos) || []));

	// True if the comment starts with '/**' but not if it is '/**/'
	return commentRanges.filter(
		(comment) =>
			text.charCodeAt(comment.pos + 1) ===
				0x2a /* ts.CharacterCodes.asterisk */ &&
			text.charCodeAt(comment.pos + 2) ===
				0x2a /* ts.CharacterCodes.asterisk */ &&
			text.charCodeAt(comment.pos + 3) !== 0x2f /* ts.CharacterCodes.slash */,
	);
}

interface IFoundComment {
	compilerNode: ts.Node;
	textRange: tsdoc.TextRange;
}

export function walkCompilerAstAndFindComments(
	node: ts.Node,
	indent: string,
	foundComments: IFoundComment[],
	statementKinds?: ts.SyntaxKind[],
): void {
	// The TypeScript AST doesn't store code comments directly.  If you want to find *every* comment,
	// you would need to rescan the SourceFile tokens similar to how tsutils.forEachComment() works:
	// https://github.com/ajafff/tsutils/blob/v3.0.0/util/util.ts#L453
	//
	// However, for this demo we are modeling a tool that discovers declarations and then analyzes their doc comments,
	// so we only care about TSDoc that would conventionally be associated with an interesting AST node.

	const buffer: string = node.getSourceFile()?.getFullText(); // don't use getText() here!

	if (!buffer) {
		console.warn("Empty buffer");
		return;
	}

	// Only consider nodes that are part of a declaration form.  Without this, we could discover
	// the same comment twice (e.g. for a MethodDeclaration and its PublicKeyword).
	if (
		statementKinds
			? statementKinds.includes(node.kind)
			: isDeclarationKind(node.kind)
	) {
		// Find "/** */" style comments associated with this node.
		// Note that this reinvokes the compiler's scanner -- the result is not cached.
		const comments: ts.CommentRange[] = getJSDocCommentRanges(node, buffer);

		for (const comment of comments) {
			foundComments.push({
				compilerNode: node,
				textRange: tsdoc.TextRange.fromStringRange(
					buffer,
					comment.pos,
					comment.end,
				),
			});
		}
	}

	// console.log(`${indent}- ${ts.SyntaxKind[node.kind]}${foundCommentsSuffix}`);

	for (const child of node.getChildren())
		walkCompilerAstAndFindComments(
			child,
			`${indent}  `,
			foundComments,
			statementKinds,
		);
}

export function parseTSDoc(foundComment: IFoundComment) {
	const customConfiguration: tsdoc.TSDocConfiguration =
		new tsdoc.TSDocConfiguration();

	const customInlineDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: "@customInline",
			syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
			allowMultiple: true,
		});

	// NOTE: Defining this causes a new DocBlock to be created under docComment.customBlocks.
	// Otherwise, a simple DocBlockTag would appear inline in the @remarks section.
	const customBlockDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: "@customBlock",
			syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
		});

	// NOTE: Defining this causes @customModifier to be removed from its section,
	// and added to the docComment.modifierTagSet
	const customModifierDefinition: tsdoc.TSDocTagDefinition =
		new tsdoc.TSDocTagDefinition({
			tagName: "@customModifier",
			syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag,
		});

	customConfiguration.addTagDefinitions([
		customInlineDefinition,
		customBlockDefinition,
		customModifierDefinition,
	]);

	const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser(
		customConfiguration,
	);
	const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(
		foundComment.textRange,
	);
	return parserContext.docComment;
}

export function parseSourceFile(
	filename: string,
	ignoreCompilationErrors = true,
) {
	const program = ts.createProgram([filename], {
		target: ts.ScriptTarget.ESNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
	});

	const compilerDiagnostics: ReadonlyArray<ts.Diagnostic> =
		program.getSemanticDiagnostics();

	if (!ignoreCompilationErrors) {
		for (const diagnostic of compilerDiagnostics) {
			const message: string = ts.flattenDiagnosticMessageText(
				diagnostic.messageText,
				"\n",
			);
			if (diagnostic.file) {
				const location: ts.LineAndCharacter =
					diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? -1);
				const formattedMessage: string =
					`${diagnostic.file.fileName}(${location.line + 1},${
						location.character + 1
					}):` + ` [TypeScript] ${message}`;
				console.error(formattedMessage);
			}

			console.error(message);
		}

		throw new Error(`Compilation errors for : ${filename}`);
	}

	if (compilerDiagnostics.length > 0)
		console.warn(
			`Ignored ${compilerDiagnostics.length} compilation errors for : ${filename}`,
		);

	const sourceFile: ts.SourceFile | undefined = program.getSourceFile(filename);
	if (!sourceFile) {
		throw new Error(`Error retrieving source file: ${filename}`);
	}

	return sourceFile;
}

const CLASS_DECLARATION_REGEX = /^export declare class (?<className>\w+)/;
const STATIC_READONLY_PROPERTY_REGEX = /^static readonly (?<fieldName>\w+):/;

export interface IStaticField {
	className: string;
	fieldName: string;
	isDeprecated: boolean;
}

export function getStaticFieldComments(filename: string) {
	const sourceFile = parseSourceFile(filename);
	const foundComments: IFoundComment[] = [];

	walkCompilerAstAndFindComments(sourceFile, "", foundComments, [
		ts.SyntaxKind.ClassDeclaration,
		ts.SyntaxKind.PropertyDeclaration,
	]);

	if (foundComments.length === 0) {
		throw new Error("No code comments were found in the input file");
	}

	const foundFields: IStaticField[] = [];
	for (const { compilerNode, textRange } of foundComments) {
		if (compilerNode.kind !== ts.SyntaxKind.PropertyDeclaration) continue;

		const fieldMatch = compilerNode
			.getText()
			.match(STATIC_READONLY_PROPERTY_REGEX);
		if (!fieldMatch?.groups) continue;
		const {
			groups: { fieldName },
		} = fieldMatch;

		const classMatch = compilerNode.parent
			.getText()
			.match(CLASS_DECLARATION_REGEX);
		if (!classMatch?.groups) continue;
		const {
			groups: { className },
		} = classMatch;

		const isDeprecated = !!parseTSDoc({ compilerNode, textRange })
			.deprecatedBlock;

		foundFields.push({
			className,
			fieldName,
			isDeprecated,
		});
	}

	return foundFields;
}
