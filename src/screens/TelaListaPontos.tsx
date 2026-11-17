import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ponto } from '../types/ponto';
import { buscarPagina } from '../services/pontosService';
import PontoItem from '../components/PontoItem';

type Props = NativeStackScreenProps<RootStackParamList, 'ListaPontos'>;

const TAMANHO_PAGINA = 10;

function TelaListaPontos({ navigation }: Props) {
    const { width } = useWindowDimensions();
    const numColunas = width >= 600 ? 2 : 1;

    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [busca, setBusca] = useState('');
    const [carregandoInicial, setCarregandoInicial] = useState(true);
    const [carregandoMais, setCarregandoMais] = useState(false);
    const [erroApi, setErroApi] = useState<string | null>(null);
    const [ultimaPagina, setUltimaPagina] = useState(false);
    const [refreshFavoritos, setRefreshFavoritos] = useState(0);

    // Refs para evitar chamadas duplicadas e condições de corrida na paginação/busca
    const paginaAtualRef = useRef(0);
    const carregandoRef = useRef(false);
    const ultimaPaginaRef = useRef(false);
    const requisicaoIdRef = useRef(0);
    const filtroAtivoRef = useRef('');
    const primeiraMontagemRef = useRef(true);

    const tocouVoltarUmaVez = useRef(false);

    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const assinatura = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                if (tocouVoltarUmaVez.current) {
                    return false;
                }

                tocouVoltarUmaVez.current = true;

                ToastAndroid.show(
                    'Toque voltar de novo para sair',
                    ToastAndroid.SHORT
                );

                setTimeout(() => {
                    tocouVoltarUmaVez.current = false;
                }, 2000);

                return true;
            }
        );

        return () => assinatura.remove();
    }, []);

    const carregarPagina = useCallback(
        async (
            pagina: number,
            filtro: string,
            reiniciar: boolean,
            silencioso = false
        ) => {
            if (!reiniciar && (carregandoRef.current || ultimaPaginaRef.current)) {
                return;
            }

            const reqId = ++requisicaoIdRef.current;
            carregandoRef.current = true;

            if (reiniciar) {
                if (!silencioso) {
                    setCarregandoInicial(true);
                }
                setErroApi(null);
            } else {
                setCarregandoMais(true);
            }

            try {
                const resultado = await buscarPagina({
                    filtro,
                    page: pagina,
                    size: TAMANHO_PAGINA,
                    sort: 'nome,asc',
                });

                // Descarta resposta se uma busca mais recente já foi disparada
                if (reqId !== requisicaoIdRef.current) {
                    return;
                }

                paginaAtualRef.current = resultado.page;
                ultimaPaginaRef.current = resultado.isLast;
                setUltimaPagina(resultado.isLast);
                setErroApi(null);

                if (reiniciar) {
                    setPontos(resultado.items);
                } else {
                    setPontos((prev) => {
                        const idsExistentes = new Set(prev.map((p) => p.id));
                        const novos = resultado.items.filter(
                            (item) => !idsExistentes.has(item.id)
                        );
                        return [...prev, ...novos];
                    });
                }
            } catch {
                if (reqId !== requisicaoIdRef.current) {
                    return;
                }

                if (reiniciar && !silencioso) {
                    setPontos([]);
                    setErroApi(
                        'Não foi possível conectar ao servidor. Verifique se a API está em execução e se o IP configurado está acessível na rede local.'
                    );
                }
            } finally {
                if (reqId === requisicaoIdRef.current) {
                    carregandoRef.current = false;
                    setCarregandoInicial(false);
                    setCarregandoMais(false);
                }
            }
        },
        []
    );

    // Carregamento inicial e reinício na primeira página sempre que o filtro de busca muda
    useEffect(() => {
        const timeout = setTimeout(() => {
            filtroAtivoRef.current = busca;
            paginaAtualRef.current = 0;
            ultimaPaginaRef.current = false;
            setUltimaPagina(false);
            carregarPagina(0, busca, true);
        }, 300);

        return () => clearTimeout(timeout);
    }, [busca, carregarPagina]);

    // Atualiza a lista sempre que o usuário retorna do cadastro, edição ou exclusão
    useFocusEffect(
        useCallback(() => {
            if (primeiraMontagemRef.current) {
                primeiraMontagemRef.current = false;
                return;
            }
            paginaAtualRef.current = 0;
            ultimaPaginaRef.current = false;
            setUltimaPagina(false);
            carregarPagina(0, filtroAtivoRef.current, true, true);
            // Força a recarga do estado de favoritos nos PontoItem
            setRefreshFavoritos((prev) => prev + 1);
        }, [carregarPagina])
    );

    function aoChegarNoFim() {
        if (
            carregandoInicial ||
            carregandoMais ||
            carregandoRef.current ||
            ultimaPagina ||
            ultimaPaginaRef.current ||
            erroApi !== null
        ) {
            return;
        }

        const proximaPagina = paginaAtualRef.current + 1;
        carregarPagina(proximaPagina, filtroAtivoRef.current, false);
    }

    function tentarNovamente() {
        paginaAtualRef.current = 0;
        ultimaPaginaRef.current = false;
        setUltimaPagina(false);
        carregarPagina(0, filtroAtivoRef.current, true);
    }

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.acoesTopo}>
                <TouchableOpacity
                    style={styles.botaoNovoPonto}
                    onPress={() => navigation.navigate('CadastroPonto')}
                >
                    <Text style={styles.botaoNovoPontoTexto}>
                        + Novo ponto
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botaoSecundario}
                    onPress={() => navigation.navigate('CadastroDoacao')}
                >
                    <Text style={styles.botaoSecundarioTexto}>
                        Registrar doação
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botaoDoacoes}
                    onPress={() => navigation.navigate('MinhasDoacoes')}
                >
                    <Text style={styles.botaoDoacoesTexto}>
                        Minhas doações
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botaoFavoritos}
                    onPress={() => navigation.navigate('MeusPontos')}
                >
                    <Text style={styles.botaoFavoritosTexto}>
                        Meus pontos
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.containerBusca}>
                <TextInput
                    placeholder="Buscar ponto por nome ou bairro..."
                    placeholderTextColor="#757575"
                    value={busca}
                    onChangeText={setBusca}
                    style={styles.busca}
                    returnKeyType="search"
                />
                {busca.length > 0 && (
                    <TouchableOpacity
                        style={styles.botaoLimpar}
                        onPress={() => setBusca('')}
                    >
                        <Text style={styles.botaoLimparTexto}>Limpar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {carregandoInicial ? (
                <View style={styles.estadoCentral}>
                    <ActivityIndicator size="large" color="#1B3A5C" />
                    <Text style={styles.estadoTexto}>
                        Carregando pontos de atendimento...
                    </Text>
                </View>
            ) : erroApi ? (
                <View style={styles.estadoCentral}>
                    <Text style={styles.erroTitulo}>
                        Servidor indisponível
                    </Text>
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
            ) : (
                <FlatList
                    key={numColunas}
                    data={pontos}
                    numColumns={numColunas}
                    columnWrapperStyle={
                        numColunas > 1 ? styles.linha : undefined
                    }
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PontoItem
                            ponto={item}
                            refreshKey={refreshFavoritos}
                            onPress={() =>
                                navigation.navigate('DetalhePonto', {
                                    id: item.id,
                                })
                            }
                        />
                    )}
                    onEndReached={aoChegarNoFim}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={
                        pontos.length === 0
                            ? styles.listaVaziaContainer
                            : styles.listaConteudo
                    }
                    ListEmptyComponent={
                        <View style={styles.estadoCentral}>
                            <Text style={styles.estadoTexto}>
                                {busca.trim() !== ''
                                    ? `Nenhum ponto encontrado para "${busca}".`
                                    : 'Nenhum ponto cadastrado no momento.'}
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        carregandoMais ? (
                            <View style={styles.rodapeCarregando}>
                                <ActivityIndicator
                                    size="small"
                                    color="#1B3A5C"
                                />
                                <Text style={styles.rodapeTexto}>
                                    Carregando mais pontos...
                                </Text>
                            </View>
                        ) : ultimaPagina && pontos.length > 0 ? (
                            <Text style={styles.fimListaTexto}>
                                Todos os pontos foram exibidos.
                            </Text>
                        ) : null
                    }
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
    acoesTopo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 12,
    },
    botaoNovoPonto: {
        flexGrow: 1,
        backgroundColor: '#2E7D32',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoNovoPontoTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    botaoSecundario: {
        flexGrow: 1,
        borderWidth: 1,
        borderColor: '#1B3A5C',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoSecundarioTexto: {
        color: '#1B3A5C',
        fontWeight: 'bold',
        fontSize: 13,
    },
    botaoDoacoes: {
        flexGrow: 1,
        backgroundColor: '#1B3A5C',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoDoacoesTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    botaoFavoritos: {
        flexGrow: 1,
        borderWidth: 1,
        borderColor: '#E53935',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoFavoritosTexto: {
        color: '#E53935',
        fontWeight: 'bold',
        fontSize: 13,
    },
    containerBusca: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        gap: 8,
    },
    busca: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        fontSize: 15,
    },
    botaoLimpar: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    botaoLimparTexto: {
        color: '#333333',
        fontWeight: '600',
    },
    linha: {
        justifyContent: 'space-between',
    },
    listaConteudo: {
        paddingBottom: 20,
    },
    listaVaziaContainer: {
        flexGrow: 1,
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
    rodapeCarregando: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    rodapeTexto: {
        fontSize: 13,
        color: '#555555',
    },
    fimListaTexto: {
        textAlign: 'center',
        fontSize: 13,
        color: '#757575',
        paddingVertical: 16,
    },
});

export default TelaListaPontos;
