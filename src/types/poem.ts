export type Poem = {
  title?: string;
  text: string;
};

export type Poems = Record<string, Poem>;
