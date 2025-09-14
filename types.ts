export interface Notebook {
  id: string;
  title: string;
  sources: Source[];
  createdAt: number;
  lastModified: number;
}

export interface SourceOrigin {
  type: 'text' | 'file' | 'website' | 'image' | 'video';
  name: string; // e.g., "Pasted Text", "document.txt", "https://example.com"
}

export interface Source {
  id: string;
  title: string;
  content: string; // For 'website' type, this will be the URL. For media, this will be a Base64 data URL.
  origin: SourceOrigin;
  mimeType?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  citations?: {
    web: {
      uri: string;
      title: string;
    }
  }[];
}