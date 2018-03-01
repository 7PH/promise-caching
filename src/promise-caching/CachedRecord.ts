
export interface CachedRecord {
    state: 'generating' | 'generated';
    created: number;
    unresolved: ((d: any) => any)[];
    data: any;
}
