export interface Thumbnail {
  url: string;
}

export interface Page {
  id: number;
  title: string;
  thumbnail?: Thumbnail;
  url: string;
}

export interface SearchResponse {
  pages: Page[];
}
