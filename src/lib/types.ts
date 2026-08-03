export type Movie = {
  id: string;
  title: string;
  description: string;
  year: number;
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
  match: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
};

export type Profile = {
  id: string;
  name: string;
  color: string;
  kids: boolean;
};
