export type Doacao = {
    id: string;
    tipoItem: string;
    quantidade: number;
    pontoDestino: string;
    criadoEm: string;
};

export type DoacaoRequest = {
    tipoItem: string;
    quantidade: number;
    pontoDestino: string;
};

export type PageDoacaoResponse = {
    content: Doacao[];
    page?: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
    number?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
    last?: boolean;
    first?: boolean;
};
