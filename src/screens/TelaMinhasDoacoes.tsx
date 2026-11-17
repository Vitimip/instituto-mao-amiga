import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Doacao } from '../types/doacao';
import { listarPagina } from '../services/doacoesService';

type Props = NativeStackScreenProps<RootStackParamList, 'MinhasDoacoes'>;

const TAMANHO_PAGINA = 10;

const ItemDoacao = ({
    doacao,
    onPress,
}: {
    doacao: Doacao;
    onPress: () => void;
}) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
            <View style={styles.doacao}>
                <Text style={styles.tipo}>Tipo: {doacao.tipoItem}</Text>

                <Text style={styles.quantidade}>
                    Quantidade: {doacao.quantidade}
                </Text>

                <Text style={styles.ponto}>
                    Ponto: {doacao.pontoDestino ?? 'Ponto não encontrado'}
                </Text>

                <Text style={styles.data}>
                    Data: {new Date(doacao.criadoEm).toLocaleString('pt-BR')}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const ItemDoacaoMemo = React.memo(ItemDoacao);

export default function TelaMinhasDoacoes({ navigation }: Props) {
    const [doacoes, setDoacoes] = useState<Doacao[]>([]);
    const [filtro, setFiltro] = useState('');
    const [filtroAtivo, setFiltroAtivo] = useState('');
    const [carregandoInicial, setCarregandoInicial] = useState(true);
    const [carregandoMais, setCarregandoMais] = useState(false);
    const [erroApi, setErroApi] = useState<string | null>(null);
    const [ultimaPagina, setUltimaPagina] = useState(false);
    const [paginaAtual, setPaginaAtual] = useState(0);
    const carregandoRef = useRef(false);

    const carregarPagina = useCallback(
        async (pagina: number, tipoItem: string, reiniciar: boolean) => {
            if (!reiniciar && (carregandoRef.current || ultimaPagina)) {
                return;
            }

            carregandoRef.current = true;

            if (reiniciar) {
                setCarregandoInicial(true);
                setErroApi(null);
            } else {
                setCarregandoMais(true);
            }

            try {
                const resultado = await listarPagina({
                    tipoItem,
                    page: pagina,
                    size: TAMANHO_PAGINA,
                    sort: 'criadoEm,desc',
                });

                if (reiniciar) {
                    setDoacoes(resultado.items);
                } else {
                    setDoacoes((prev) => [...prev, ...resultado.items]);
                }

                setPaginaAtual(resultado.page);
                setUltimaPagina(resultado.isLast);
            } catch {
                if (reiniciar) {
                    setErroApi(
                        'Não foi possível conectar à API. Verifique se o servidor está ligado.'
                    );
                }
            } finally {
                setCarregandoInicial(false);
                setCarregandoMais(false);
                carregandoRef.current = false;
            }
        },
        [ultimaPagina]
    );

    useFocusEffect(
        useCallback(() => {
            carregarPagina(0, filtroAtivo, true);
        }, [carregarPagina, filtroAtivo])
    );

    function aplicarFiltro() {
        setFiltroAtivo(filtro);
        setPaginaAtual(0);
        setUltimaPagina(false);
        carregarPagina(0, filtro, true);
    }

    function limparFiltro() {
        setFiltro('');
        setFiltroAtivo('');
        setPaginaAtual(0);
        setUltimaPagina(false);
        carregarPagina(0, '', true);
    }

    function carregarMais() {
        if (!ultimaPagina && !carregandoRef.current) {
            carregarPagina(paginaAtual + 1, filtroAtivo, false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.titulo}>Minhas doações</Text>

            <View style={styles.buscaContainer}>
                <TextInput
                    style={styles.campoBusca}
                    value={filtro}
                    onChangeText={setFiltro}
                    placeholder="Filtrar por tipo de item"
                    placeholderTextColor="#757575"
                    returnKeyType="search"
                    onSubmitEditing={aplicarFiltro}
                />
                {filtroAtivo !== '' && (
                    <TouchableOpacity
                        style={styles.botaoLimpar}
                        onPress={limparFiltro}
                    >
                        <Text style={styles.botaoLimparTexto}>Limpar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {carregandoInicial && doacoes.length === 0 ? (
                <View style={styles.centro}>
                    <ActivityIndicator size="large" color="#1B3A5C" />
                    <Text style={styles.mensagem}>
                        Carregando doações da API...
                    </Text>
                </View>
            ) : erroApi && doacoes.length === 0 ? (
                <View style={styles.centro}>
                    <Text style={styles.mensagemErro}>{erroApi}</Text>
                    <TouchableOpacity
                        style={styles.botao}
                        onPress={() => carregarPagina(0, filtroAtivo, true)}
                    >
                        <Text style={styles.botaoTexto}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : doacoes.length === 0 ? (
                <View style={styles.centro}>
                    <Text style={styles.mensagem}>
                        {filtroAtivo
                            ? `Nenhuma doação encontrada para "${filtroAtivo}".`
                            : 'Você ainda não registrou nenhuma doação.'}
                    </Text>

                    {filtroAtivo === '' && (
                        <TouchableOpacity
                            style={styles.botao}
                            onPress={() =>
                                navigation.navigate('CadastroDoacao')
                            }
                        >
                            <Text style={styles.botaoTexto}>
                                Registrar doação
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={doacoes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ItemDoacaoMemo
                            doacao={item}
                            onPress={() =>
                                navigation.navigate('DetalheDoacao', {
                                    id: item.id,
                                })
                            }
                        />
                    )}
                    onEndReached={carregarMais}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        carregandoMais ? (
                            <View style={styles.carregandoFooter}>
                                <ActivityIndicator
                                    size="small"
                                    color="#1B3A5C"
                                />
                                <Text style={styles.mensagem}>
                                    Carregando mais...
                                </Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.lista}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    titulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginBottom: 12,
    },
    buscaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    campoBusca: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: '#BDBDBD',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#222222',
    },
    botaoLimpar: {
        backgroundColor: '#1B3A5C',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    botaoLimparTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    centro: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    mensagem: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        marginTop: 12,
    },
    mensagemErro: {
        fontSize: 16,
        color: '#C62828',
        textAlign: 'center',
        marginTop: 12,
    },
    botao: {
        backgroundColor: '#1B3A5C',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 16,
    },
    botaoTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    lista: {
        paddingBottom: 16,
    },
    doacao: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    tipo: {
        fontSize: 16,
        fontWeight: '600',
    },
    quantidade: {
        fontSize: 14,
        marginTop: 4,
    },
    ponto: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
    data: {
        fontSize: 13,
        color: '#757575',
        marginTop: 4,
    },
    carregandoFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
});
