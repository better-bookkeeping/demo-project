export type UnwrapAsyncIterator<T> = T extends AsyncIterator<infer U> ? U : never;

export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

export type Prettify<T> = { [K in keyof T]: T[K] };
