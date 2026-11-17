import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
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
import { Ponto } from '../types/ponto';
import { Doacao } from '../types/doacao';
import { ApiError } from '../services/api';
import { listar as listarPontosApi } from '../services/pontosService';
import { cadastrar, editar, listarPagina } from '../services/doacoesService';

type Props = NativeStackScreenProps<RootStackParamList, 'CadastroDoacao'>;

const TAMANHO_PAGINA = 10;

export default function TelaCadastroDoacao({ route, navigation }: Props) {
    const doacaoParaEditar = route.params?.doacao;

    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [carregandoPontos, setCarregandoPontos] = useState(true);
    const [erroPontos, setErroPontos] = useState<string | null>(null);

    const [tipoItem, setTipoItem] = useState(
        doacaoParaEditar?.tipoItem ?? ''
    );
    const [quantidade, setQuantidade] = useState(
        doacaoParaEditar?.quantidade?.toString() ?? ''
    );
    const [pontoDestinoSelecionado, setPontoDestinoSelecionado] =
        useState<string | null>(doacaoParaEditar?.pontoDestino ?? null);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Histórico local para mostrar no topo da tela de cadastro
    const [doacoes, setDoacoes] = useState<Doacao[]>([]);
    const [carregandoHistorico, setCarregandoHistorico] = useState(true);
    const [erroHistorico, setErroHistorico] = useState<string | null>(null);
    const [paginaHistorico, setPaginaHistorico] = useState(0);
    const [ultimaPaginaHistorico, setUltimaPaginaHistorico] = useState(false);
    const carregandoRef = useRef(false);

    useEffect(() => {
        async function carregarPontos() {
            setCarregandoPontos(true);
            setErroPontos(null);
            try {
                const lista = await listarPontosApi();
                setPontos(lista);
            } catch {
                setErroPontos(
                    'Não foi possível carregar os pontos da API para seleção.'
                );
            } finally {
                setCarregandoPontos(false);
            }
        }

        carregarPontos();
    }, []);

    const carregarHistorico = useCallback(
        async (pagina: number, reiniciar: boolean) => {
            if (carregandoRef.current) return;
            carregandoRef.current = true;

            if (reiniciar) {
                setCarregandoHistorico(true);
                setErroHistorico(null);
            }

            try {
                const resultado = await listarPagina({
                    page: pagina,
                    size: TAMANHO_PAGINA,
                    sort: 'criadoEm,desc',
                });

                if (reiniciar) {
                    setDoacoes(resultado.items);
                } else {
                    setDoacoes((prev) => [...prev, ...resultado.items]);
                }

                setPaginaHistorico(resultado.page);
                setUltimaPaginaHistorico(resultado.isLast);
            } catch {
                if (reiniciar) {
                    setErroHistorico(
                        'Não foi possível carregar o histórico de doações.'
                    );
                }
            } finally {
                setCarregandoHistorico(false);
                carregandoRef.current = false;
            }
        },
        []
    );

    useFocusEffect(
        useCallback(() => {
            carregarHistorico(0, true);
        }, [carregarHistorico])
    );

    async function validar() {
        setSucesso(false);
        setErro('');

        if (tipoItem.trim() === '') {
            setErro('Informe o tipo do item.');
            return;
        }

        if (quantidade.trim() === '' || !/^\d+$/.test(quantidade.trim())) {
            setErro('Quantidade deve ser um número válido.');
            return;
        }

        if (!pontoDestinoSelecionado) {
            setErro('Selecione um ponto de destino.');
            return;
        }

        setEnviando(true);

        try {
            const dados = {
                tipoItem: tipoItem.trim(),
                quantidade: Number(quantidade),
                pontoDestino: pontoDestinoSelecionado,
            };

            if (doacaoParaEditar) {
                await editar(doacaoParaEditar.id, dados);
                navigation.goBack();
            } else {
                await cadastrar(dados);
                setErro('');
                setSucesso(true);
                await carregarHistorico(0, true);
                setTipoItem('');
                setQuantidade('');
                setPontoDestinoSelecionado(null);
                Keyboard.dismiss();
            }
        } catch (e) {
            if (e instanceof ApiError) {
                if (doacaoParaEditar) {
                    Alert.alert(
                        'Erro',
                        e.message ??
                            'Não foi possível salvar as alterações. Tente novamente.'
                    );
                } else {
                    setErro(
                        e.message ??
                            'Não foi possível registrar a doação. Tente novamente.'
                    );
                }
            } else {
                if (doacaoParaEditar) {
                    Alert.alert(
                        'Erro',
                        'Erro inesperado ao salvar as alterações. Tente novamente.'
                    );
                } else {
                    setErro(
                        'Erro inesperado ao registrar a doação. Tente novamente.'
                    );
                }
            }
        } finally {
            setEnviando(false);
        }
    }

    function nomePonto(doacao: Doacao) {
        return doacao.pontoDestino ?? 'Ponto não encontrado';
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.teclado}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Text style={styles.titulo}>
                    {doacaoParaEditar ? 'Editar doação' : 'Registrar doação'}
                </Text>

                <Text style={styles.rotulo}>Tipo do item</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Ex.: Alimentos, roupas, higiene..."
                    value={tipoItem}
                    onChangeText={(texto) => {
                        setTipoItem(texto);
                        setSucesso(false);
                    }}
                    returnKeyType="next"
                />

                <Text style={styles.rotulo}>Quantidade</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Ex.: 10"
                    value={quantidade}
                    onChangeText={(texto) => {
                        if (texto === '' || /^\d+$/.test(texto)) {
                            setQuantidade(texto);
                            setErro('');
                        } else {
                            setErro('Quantidade deve conter apenas números.');
                        }

                        setSucesso(false);
                    }}
                    keyboardType="numeric"
                    returnKeyType="done"
                />

                <Text style={styles.rotulo}>Ponto de destino</Text>

                {carregandoPontos ? (
                    <View style={styles.carregandoBox}>
                        <ActivityIndicator size="small" color="#1B3A5C" />
                        <Text style={styles.carregandoTexto}>
                            Carregando pontos da API...
                        </Text>
                    </View>
                ) : erroPontos ? (
                    <Text style={styles.erro}>{erroPontos}</Text>
                ) : (
                    <View style={styles.listaPontos}>
                        {pontos.map((ponto) => {
                            const selecionado =
                                ponto.nome === pontoDestinoSelecionado;

                            return (
                                <TouchableOpacity
                                    key={ponto.id}
                                    style={[
                                        styles.chipPonto,
                                        selecionado &&
                                            styles.chipPontoSelecionado,
                                    ]}
                                    onPress={() => {
                                        setPontoDestinoSelecionado(ponto.nome);
                                        setSucesso(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.chipPontoTexto,
                                            selecionado &&
                                                styles.chipPontoTextoSelecionado,
                                        ]}
                                    >
                                        {ponto.nome}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {erro !== '' && <Text style={styles.erro}>{erro}</Text>}

                {sucesso && (
                    <Text style={styles.sucesso}>
                        Doação registrada com sucesso!
                    </Text>
                )}

                <TouchableOpacity
                    style={[
                        styles.botao,
                        enviando && styles.botaoDesabilitado,
                    ]}
                    onPress={validar}
                    disabled={enviando}
                >
                    {enviando ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.botaoTexto}>
                            {doacaoParaEditar
                                ? 'Salvar alterações'
                                : 'Registrar doação'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botaoCancelar}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>

                <Text style={styles.tituloDoacoes}>Histórico de doações</Text>

                {carregandoHistorico && doacoes.length === 0 ? (
                    <View style={styles.carregandoBox}>
                        <ActivityIndicator size="small" color="#1B3A5C" />
                        <Text style={styles.carregandoTexto}>
                            Carregando histórico...
                        </Text>
                    </View>
                ) : erroHistorico && doacoes.length === 0 ? (
                    <View style={styles.vazio}>
                        <Text style={styles.mensagemVazio}>
                            {erroHistorico}
                        </Text>
                    </View>
                ) : doacoes.length === 0 ? (
                    <View style={styles.vazio}>
                        <Text style={styles.mensagemVazio}>
                            Nenhuma doação registrada ainda.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={doacoes}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate('DetalheDoacao', {
                                        id: item.id,
                                    })
                                }
                                activeOpacity={0.6}
                            >
                                <View style={styles.doacao}>
                                    <Text style={styles.tipo}>
                                        Tipo: {item.tipoItem}
                                    </Text>

                                    <Text style={styles.quantidade}>
                                        Quantidade: {item.quantidade}
                                    </Text>

                                    <Text style={styles.ponto}>
                                        Ponto: {nomePonto(item)}
                                    </Text>

                                    <Text style={styles.data}>
                                        Criado em:{' '}
                                        {new Date(item.criadoEm).toLocaleString(
                                            'pt-BR'
                                        )}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        onEndReached={() => {
                            if (
                                !ultimaPaginaHistorico &&
                                !carregandoRef.current
                            ) {
                                carregarHistorico(paginaHistorico + 1, false);
                            }
                        }}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={
                            carregandoRef.current && doacoes.length > 0
                                ? (
                                    <View style={styles.carregandoBox}>
                                        <ActivityIndicator
                                            size="small"
                                            color="#1B3A5C"
                                        />
                                        <Text style={styles.carregandoTexto}>
                                            Carregando mais...
                                        </Text>
                                    </View>
                                )
                                : null
                        }
                    />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    teclado: {
        flex: 1,
        padding: 16,
    },
    titulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginBottom: 16,
    },
    tituloDoacoes: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginTop: 24,
        marginBottom: 12,
    },
    rotulo: {
        fontSize: 13,
        color: '#757575',
        marginTop: 12,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    carregandoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    carregandoTexto: {
        fontSize: 13,
        color: '#555555',
    },
    listaPontos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chipPonto: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        minHeight: 40,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipPontoSelecionado: {
        backgroundColor: '#1B3A5C',
        borderColor: '#1B3A5C',
    },
    chipPontoTexto: {
        color: '#1B3A5C',
    },
    chipPontoTextoSelecionado: {
        color: '#FFFFFF',
    },
    erro: {
        color: '#C62828',
        marginTop: 12,
    },
    sucesso: {
        color: '#2E7D32',
        marginTop: 12,
    },
    botao: {
        backgroundColor: '#1B3A5C',
        borderRadius: 8,
        minHeight: 44,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    botaoTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
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
        fontSize: 16,
        fontWeight: '600',
    },
    doacao: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    data: {
        fontSize: 13,
        color: '#757575',
        marginTop: 4,
    },
    botaoCancelar: {
        borderWidth: 1,
        borderColor: '#1B3A5C',
        borderRadius: 8,
        minHeight: 44,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    botaoCancelarTexto: {
        color: '#1B3A5C',
        fontWeight: 'bold',
    },
    botaoDesabilitado: {
        opacity: 0.6,
    },
    vazio: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        minHeight: 120,
    },
    mensagemVazio: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
    },
});
