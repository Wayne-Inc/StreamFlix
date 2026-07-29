export type Movie = {
  id: string;
  title: string;
  description: string;
  year: number;
  rating: string;
  runtime: string;
  genres: string[];
  poster: string;
  backdrop: string;
  trailer?: string;
  cast: string[];
  castPfp: string[];
  castRoles?: string[];
  director: string;
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
