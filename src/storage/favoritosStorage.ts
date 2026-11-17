import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_FAVORITOS = '@pontosFavoritos';

export async function listarFavoritos(): Promise<string[]> {
    try {
        const dados = await AsyncStorage.getItem(CHAVE_FAVORITOS);
        if (!dados) {
            return [];
        }
        return JSON.parse(dados);
    } catch {
        return [];
    }
}

export async function adicionarFavorito(id: string): Promise<string[]> {
    try {
        const favoritos = await listarFavoritos();
        if (!favoritos.includes(id)) {
            favoritos.push(id);
            await AsyncStorage.setItem(
                CHAVE_FAVORITOS,
                JSON.stringify(favoritos)
            );
        }
        return favoritos;
    } catch {
        return [];
    }
}

export async function removerFavorito(id: string): Promise<string[]> {
    try {
        const favoritos = await listarFavoritos();
        const atualizados = favoritos.filter((favId) => favId !== id);
        await AsyncStorage.setItem(
            CHAVE_FAVORITOS,
            JSON.stringify(atualizados)
        );
        return atualizados;
    } catch {
        return [];
    }
}

export async function toggleFavorito(id: string): Promise<string[]> {
    const favoritos = await listarFavoritos();
    if (favoritos.includes(id)) {
        return removerFavorito(id);
    } else {
        return adicionarFavorito(id);
    }
}

export async function ehFavorito(id: string): Promise<boolean> {
    const favoritos = await listarFavoritos();
    return favoritos.includes(id);
}
