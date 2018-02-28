
export interface CachedObject {
    state: 'generating' | 'generated';
    created: number;
    unresolved: ((d: any) => any)[];
    data: any;
}
