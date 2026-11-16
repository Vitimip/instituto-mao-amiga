export type TipoPonto = 'coleta' | 'distribuição' | string;

export type Ponto = {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
    horario: string;
    tipo: TipoPonto;
};

export type PontoRequest = {
    nome: string;
    endereco: string;
    bairro: string;
    horario: string;
    tipo: 'coleta' | 'distribuição';
};

export type PageMetadata = {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
};

export type PageResponse<T> = {
    content: T[];
    page?: PageMetadata;
    // Fallback caso o Spring serialize no formato padrão PageImpl
    number?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
    last?: boolean;
    first?: boolean;
};
