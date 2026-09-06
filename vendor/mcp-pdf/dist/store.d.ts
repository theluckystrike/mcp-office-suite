/**
 * The register of operations this server performed, plus the same corrupt-file
 * discipline the rest of the suite uses: a read or parse failure is never reported
 * as "empty", because the next write would then overwrite a history still on disk.
 */
export interface OpRecord {
    id: string;
    op: string;
    inputs: string[];
    outputs: string[];
    pages?: number;
    note?: string;
    created: string;
}
export declare function dataDir(): string;
export declare class CorruptDataError extends Error {
}
export declare function markerPath(file: string): string;
export declare function readJsonFile<T>(file: string, empty: T): T;
export declare function getOps(): OpRecord[];
export declare function addOp(rec: OpRecord): void;
