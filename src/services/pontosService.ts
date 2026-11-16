import { del, get, post, put } from './api';
import { PageResponse, Ponto, PontoRequest } from '../types/ponto';

export type BuscarPaginaParams = {
    filtro?: string;
    page?: number;
    size?: number;
    sort?: string;
};

export type PaginaPontosResult = {
    items: Ponto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    isLast: boolean;
};

const RECURSO_PONTOS = '/pontos';

export async function listar(): Promise<Ponto[]> {
    return get<Ponto[]>(RECURSO_PONTOS);
}

export async function buscarPagina({
    filtro = '',
    page = 0,
    size = 10,
    sort = 'nome,asc',
}: BuscarPaginaParams = {}): Promise<PaginaPontosResult> {
    const query = new URLSearchParams();
    if (filtro.trim() !== '') {
        query.append('filtro', filtro.trim());
    }
    query.append('page', String(page));
    query.append('size', String(size));
    if (sort) {
        query.append('sort', sort);
    }

    const data = await get<PageResponse<Ponto>>(`${RECURSO_PONTOS}/filtro?${query.toString()}`);

    const currentPage = data.page?.number ?? data.number ?? page;
    const pageSize = data.page?.size ?? data.size ?? size;
    const totalElements = data.page?.totalElements ?? data.totalElements ?? data.content.length;
    const totalPages =
        data.page?.totalPages ??
        data.totalPages ??
        (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 1);

    const isLast =
        typeof data.last === 'boolean'
            ? data.last
            : totalPages === 0 || currentPage >= totalPages - 1;

    return {
        items: data.content ?? [],
        page: currentPage,
        size: pageSize,
        totalElements,
        totalPages,
        isLast,
    };
}

export async function buscarPorId(id: string): Promise<Ponto> {
    return get<Ponto>(`${RECURSO_PONTOS}/${encodeURIComponent(id)}`);
}

export async function cadastrar(dados: PontoRequest): Promise<Ponto> {
    return post<Ponto>(RECURSO_PONTOS, dados);
}

export async function editar(id: string, dados: PontoRequest): Promise<Ponto> {
    return put<Ponto>(`${RECURSO_PONTOS}/${encodeURIComponent(id)}`, dados);
}

export async function excluir(id: string): Promise<void> {
    return del<void>(`${RECURSO_PONTOS}/${encodeURIComponent(id)}`);
}
