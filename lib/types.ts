export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  fileUrl: string | null;
  fileContent?: string | null;
}

export interface Extraction {
  id: string;
  text: string;
  pageNumber: number;
  documentId: string;
}

export type DocumentMap = {
  [key: string]: Document | null;
};

export type ExtractionMap = {
  [documentId: string]: Extraction[];
};
