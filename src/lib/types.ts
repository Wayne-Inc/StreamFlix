export type Movie = {
  id: string;
  title: string;
  description: string;
  year: number;
  releaseDate?: string;
  rating: string;
  runtime: string;
  genres: string[];
  genreIds: number[];
  poster: string;
  backdrop: string;
  backdropSm?: string;
  trailer?: string;
  cast: string[];
  castPfp: string[];
  castRoles?: string[];
  castIds?: string[];
  director: string;
  directorId: string;
  directorPfp?: string;
  match: number;
  score?: number;
  popularity?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
};

export type Profile = {
  id: string;
  name: string;
  color: string;
  kids: boolean;
};
