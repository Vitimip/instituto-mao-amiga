import { del, get, post, put } from './api';
import { Doacao, DoacaoRequest, PageDoacaoResponse } from '../types/doacao';

export type BuscarPaginaParams = {
    tipoItem?: string;
    page?: number;
    size?: number;
    sort?: string;
};

export type PaginaDoacoesResult = {
    items: Doacao[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    isLast: boolean;
};

const RECURSO_DOACOES = '/doacoes';

export async function listarPagina({
    tipoItem = '',
    page = 0,
    size = 10,
    sort = 'criadoEm,desc',
}: BuscarPaginaParams = {}): Promise<PaginaDoacoesResult> {
    const query = new URLSearchParams();
    if (tipoItem.trim() !== '') {
        query.append('tipoItem', tipoItem.trim());
    }
    query.append('page', String(page));
    query.append('size', String(size));
    if (sort) {
        query.append('sort', sort);
    }

    const data = await get<PageDoacaoResponse>(
        `${RECURSO_DOACOES}/filtro?${query.toString()}`
    );

    const currentPage = data.page?.number ?? data.number ?? page;
    const pageSize = data.page?.size ?? data.size ?? size;
    const totalElements =
        data.page?.totalElements ?? data.totalElements ?? data.content.length;
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

export async function buscarPorId(id: string): Promise<Doacao> {
    return get<Doacao>(`${RECURSO_DOACOES}/${encodeURIComponent(id)}`);
}

export async function cadastrar(dados: DoacaoRequest): Promise<Doacao> {
    return post<Doacao>(RECURSO_DOACOES, dados);
}

export async function editar(
    id: string,
    dados: DoacaoRequest
): Promise<Doacao> {
    return put<Doacao>(`${RECURSO_DOACOES}/${encodeURIComponent(id)}`, dados);
}

export async function excluir(id: string): Promise<void> {
    return del<void>(`${RECURSO_DOACOES}/${encodeURIComponent(id)}`);
}
