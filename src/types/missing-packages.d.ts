// Type declarations for packages without proper types export

declare module "mammoth" {
  export interface MammothResult {
    value: string
    messages: Array<{ type: string; message: string }>
  }
  export interface ConvertToHtmlOptions {
    arrayBuffer: ArrayBuffer
    styleMap?: string
  }
  export function convertToHtml(options: ConvertToHtmlOptions): Promise<MammothResult>
}

declare module "xlsx" {
  export interface WorkBook {
    SheetNames: string[]
    Sheets: Record<string, WorkSheet>
  }
  export interface WorkSheet {
    [key: string]: CellObject | undefined
    "!ref"?: string
    "!cols"?: ColInfo[]
    "!rows"?: RowInfo[]
    "!merges"?: Range[]
  }
  export interface CellObject {
    v: unknown
    w?: string
    t: string
    f?: string
    r?: string[]
    h?: string
    c?: Comment[]
    z?: string
    l?: Hyperlink
    s?: CellStyle
  }
  export interface ColInfo {
    wch?: number
    width?: number
    wpx?: number
    level?: number
    hidden?: boolean
  }
  export interface RowInfo {
    hpx?: number
    hpt?: number
    level?: number
    hidden?: boolean
  }
  export interface Range {
    s: { c: number; r: number }
    e: { c: number; r: number }
  }
  export interface Comment {
    a: string
    t: string
    r: Run[]
  }
  export interface Run {
    t: string
    f?: Font
    v?: string
  }
  export interface Font {
    name?: string
    sz?: number
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    color?: { rgb?: string; theme?: number; tint?: number }
  }
  export interface Hyperlink {
    Target: string
    Tooltip?: string
  }
  export interface CellStyle {
    font?: Font
    numFmt?: string
    fill?: Fill
    border?: Border
    alignment?: Alignment
    protection?: Protection
  }
  export interface Fill {
    patternType?: string
    fgColor?: Color
    bgColor?: Color
  }
  export interface Border {
    top?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
    right?: BorderStyle
    diagonal?: BorderStyle
    diagonalUp?: boolean
    diagonalDown?: boolean
  }
  export interface BorderStyle {
    style?: string
    color?: Color
  }
  export interface Color {
    rgb?: string
    theme?: number
    tint?: number
    auto?: number
  }
  export interface Alignment {
    horizontal?: string
    vertical?: string
    wrapText?: boolean
    readingOrder?: number
    textRotation?: number
    indent?: number
    relativeIndent?: number
    justifyLastLine?: boolean
    shrinkToFit?: boolean
  }
  export interface Protection {
    locked?: boolean
    hidden?: boolean
  }
  export type CellValue = string | number | boolean | Date | null | undefined

  export interface ReadOptions {
    cellStyles?: boolean
    cellFormula?: boolean
    cellHTML?: boolean
    cellNF?: boolean
    cellText?: boolean
    cellDates?: boolean
    dateNF?: string
    sheetStubs?: boolean
    sheetRows?: number
    bookDeps?: boolean
    bookFiles?: boolean
    bookProps?: boolean
    bookSheets?: boolean
    bookVBA?: boolean
    password?: string
    WTF?: boolean
    type?: string
    codepage?: number
    raw?: boolean
    dense?: boolean
  }

  export interface WriteOptions {
    bookType?: string
    bookSST?: boolean
    type?: string
    cellStyles?: boolean
    bookVBA?: boolean
    password?: string
    compression?: boolean
    WTF?: boolean
    Props?: BookProps
    codepage?: number
    dense?: boolean
  }

  export interface BookProps {
    Title?: string
    Subject?: string
    Author?: string
    Manager?: string
    Company?: string
    Category?: string
    Keywords?: string
    Comments?: string
    LastAuthor?: string
    CreatedDate?: Date
    ModifiedDate?: Date
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  export function read(
    data: Buffer | ArrayBuffer | Uint8Array | string,
    opts?: ReadOptions,
  ): WorkBook
  export const utils: {
    sheet_to_html: (sheet: WorkSheet, opts?: any) => string
    sheet_to_json: (sheet: WorkSheet, opts?: any) => unknown[]
    sheet_to_csv: (sheet: WorkSheet, opts?: any) => string
    sheet_to_txt: (sheet: WorkSheet, opts?: any) => string
    sheet_to_formulae: (sheet: WorkSheet) => string[]
    sheet_to_row_object_array: (sheet: WorkSheet, opts?: any) => Array<Record<string, unknown>>
    sheet_to_html: (sheet: WorkSheet, opts?: any) => string
    json_to_sheet: (js: unknown[], opts?: any) => WorkSheet
    aoa_to_sheet: (data: unknown[][], opts?: any) => WorkSheet
    table_to_sheet: (table: HTMLElement, opts?: any) => WorkSheet
    sheet_add_aoa: (sheet: WorkSheet, data: unknown[][], opts?: any) => WorkSheet
    sheet_add_json: (sheet: WorkSheet, data: unknown[], opts?: any) => WorkSheet
    decode_cell: (str: string) => { c: number; r: number }
    encode_cell: (cell: { c: number; r: number }) => string
    encode_col: (col: number) => string
    decode_col: (str: string) => number
    encode_range: (range: { s: { c: number; r: number }; e: { c: number; r: number } }) => string
    decode_range: (str: string) => { s: { c: number; r: number }; e: { c: number; r: number } }
    format_cell: (cell: CellObject, v: unknown, opts?: any) => string
    get_formulae: (sheet: WorkSheet) => string[]
    make_csv: (sheet: WorkSheet, opts?: any) => string
    sheet_to_csv: (sheet: WorkSheet, opts?: any) => string
    sheet_to_json: (sheet: WorkSheet, opts?: any) => unknown[]
  }
}

declare module "pdfjs-dist" {
  export interface TextContent {
    items: Array<{
      str: string
      dir?: string
      transform?: number[]
      width?: number
      height?: number
      fontName?: string
    }>
  }
  export interface TextItem {
    str: string
    dir?: string
    transform?: number[]
    width?: number
    height?: number
    fontName?: string
  }
  export interface PDFPageProxy {
    getTextContent(params?: { normalizeWhitespace?: boolean }): Promise<TextContent>
    render(params: {
      canvasContext: CanvasRenderingContext2D
      viewport: { width: number; height: number; transform: number[] }
    }): { promise: Promise<void> }
    getViewport(params: { scale: number }): { width: number; height: number; transform: number[] }
  }
  export interface PDFDocumentProxy {
    numPages: number
    getPage(pageNumber: number): Promise<PDFPageProxy>
  }
  export interface GetDocumentParams {
    data: ArrayBuffer | Uint8Array
    password?: string
    length?: number
  }
  export function getDocument(params: GetDocumentParams): {
    promise: Promise<PDFDocumentProxy>
  }
  export const GlobalWorkerOptions: {
    workerSrc: string
  }
}
