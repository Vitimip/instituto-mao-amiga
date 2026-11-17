import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ponto } from '../types/ponto';
import { buscarPorId } from '../services/pontosService';
import {
    listarFavoritos,
    removerFavorito,
} from '../storage/favoritosStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'MeusPontos'>;

type PontoFavorito = Ponto & {
    favorito: boolean;
};

function PontoFavoritoItem({
    ponto,
    onNavigate,
    onDesmarcar,
}: {
    ponto: PontoFavorito;
    onNavigate: () => void;
    onDesmarcar: () => void;
}) {
    const isColeta = ponto.tipo.toLowerCase() === 'coleta';

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardConteudo}
                onPress={onNavigate}
                activeOpacity={0.7}
            >
                <View style={styles.cabecalho}>
                    <Text style={styles.nome}>{ponto.nome}</Text>
                    <View
                        style={[
                            styles.badge,
                            isColeta ? styles.badgeColeta : styles.badgeDistribuicao,
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeTexto,
                                isColeta
                                    ? styles.badgeTextoColeta
                                    : styles.badgeTextoDistribuicao,
                            ]}
                        >
                            {ponto.tipo}
                        </Text>
                    </View>
                </View>

                <Text style={styles.endereco}>
                    {ponto.endereco} — {ponto.bairro}
                </Text>
                <Text style={styles.horario}>Horário: {ponto.horario}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.botaoDesmarcar}
                onPress={onDesmarcar}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.6}
            >
                <Text style={styles.iconeDesmarcar}>♥</Text>
                <Text style={styles.textoDesmarcar}>Desmarcar</Text>
            </TouchableOpacity>
        </View>
    );
}

function TelaMeusPontos({ navigation }: Props) {
    const [pontos, setPontos] = useState<PontoFavorito[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroApi, setErroApi] = useState<string | null>(null);

    const carregarFavoritos = useCallback(async () => {
        setCarregando(true);
        setErroApi(null);

        try {
            const idsFavoritos = await listarFavoritos();

            if (idsFavoritos.length === 0) {
                setPontos([]);
                setCarregando(false);
                return;
            }

            const resultados: PontoFavorito[] = [];
            const idsNaoEncontrados: string[] = [];

            for (const id of idsFavoritos) {
                try {
                    const ponto = await buscarPorId(id);
                    resultados.push({ ...ponto, favorito: true });
                } catch (err: any) {
                    // Se o ponto foi excluído (404) ou outro erro, marca como não encontrado
                    if (err?.status === 404) {
                        idsNaoEncontrados.push(id);
                    } else {
                        throw err;
                    }
                }
            }

            // Remove os IDs que não foram encontrados do AsyncStorage
            if (idsNaoEncontrados.length > 0) {
                for (const id of idsNaoEncontrados) {
                    await removerFavorito(id);
                }
            }

            setPontos(resultados);
        } catch {
            setErroApi(
                'Não foi possível conectar ao servidor. Verifique se a API está em execução.'
            );
        } finally {
            setCarregando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            carregarFavoritos();
        }, [carregarFavoritos])
    );

    async function handleDesmarcar(id: string) {
        await removerFavorito(id);
        setPontos((prev) => prev.filter((p) => p.id !== id));
    }

    function tentarNovamente() {
        carregarFavoritos();
    }

    return (
        <SafeAreaView style={styles.area}>
            <Text style={styles.titulo}>Meus pontos favoritos</Text>

            {carregando ? (
                <View style={styles.estadoCentral}>
                    <ActivityIndicator size="large" color="#1B3A5C" />
                    <Text style={styles.estadoTexto}>
                        Carregando seus pontos favoritos...
                    </Text>
                </View>
            ) : erroApi ? (
                <View style={styles.estadoCentral}>
                    <Text style={styles.erroTitulo}>Servidor indisponível</Text>
                    <Text style={styles.erroDescricao}>{erroApi}</Text>
                    <TouchableOpacity
                        style={styles.botaoTentarNovamente}
                        onPress={tentarNovamente}
                    >
                        <Text style={styles.botaoTentarNovamenteTexto}>
                            Tentar novamente
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : pontos.length === 0 ? (
                <View style={styles.estadoCentral}>
                    <Text style={styles.estadoTexto}>
                        Você ainda não favoritou nenhum ponto.
                    </Text>
                    <Text style={styles.estadoSubtexto}>
                        Toque no ♡ de um ponto na lista para adicioná-lo aqui.
                    </Text>
                    <TouchableOpacity
                        style={styles.botaoVoltar}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.botaoVoltarTexto}>
                            Voltar para a lista
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={pontos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PontoFavoritoItem
                            ponto={item}
                            onNavigate={() =>
                                navigation.navigate('DetalhePonto', {
                                    id: item.id,
                                })
                            }
                            onDesmarcar={() => handleDesmarcar(item.id)}
                        />
                    )}
                    contentContainerStyle={styles.listaConteudo}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    titulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
    },
    cardConteudo: {
        padding: 14,
        paddingBottom: 10,
    },
    cabecalho: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    nome: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#1B3A5C',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeColeta: {
        backgroundColor: '#E3F2FD',
    },
    badgeDistribuicao: {
        backgroundColor: '#E8F5E9',
    },
    badgeTexto: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    badgeTextoColeta: {
        color: '#1565C0',
    },
    badgeTextoDistribuicao: {
        color: '#2E7D32',
    },
    endereco: {
        fontSize: 14,
        color: '#424242',
        marginTop: 6,
    },
    horario: {
        fontSize: 13,
        color: '#757575',
        marginTop: 4,
    },
    botaoDesmarcar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        minHeight: 44,
    },
    iconeDesmarcar: {
        fontSize: 18,
        color: '#E53935',
    },
    textoDesmarcar: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E53935',
    },
    listaConteudo: {
        paddingBottom: 20,
    },
    estadoCentral: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    estadoTexto: {
        marginTop: 12,
        fontSize: 15,
        color: '#555555',
        textAlign: 'center',
    },
    estadoSubtexto: {
        marginTop: 8,
        fontSize: 13,
        color: '#757575',
        textAlign: 'center',
        marginBottom: 20,
    },
    erroTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C62828',
        marginBottom: 8,
        textAlign: 'center',
    },
    erroDescricao: {
        fontSize: 14,
        color: '#4A4A4A',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    botaoTentarNovamente: {
        backgroundColor: '#1B3A5C',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    botaoTentarNovamenteTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    botaoVoltar: {
        marginTop: 16,
        backgroundColor: '#1B3A5C',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoVoltarTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default TelaMeusPontos;
