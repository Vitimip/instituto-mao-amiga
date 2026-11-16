import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ponto } from '../types/ponto';
import { listar as listarPontosApi } from '../services/pontosService';
import {
    atualizarDoacao,
    Doacao,
    listarDoacoes,
    salvarDoacao,
} from '../storage/doacoesStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'CadastroDoacao'>;

export default function TelaCadastroDoacao({ route, navigation }: Props) {
    const doacaoEditando = route.params?.doacao;
    const pontoIdInicial = route.params?.pontoId ?? null;
    const modoEdicao = !!doacaoEditando;

    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [carregandoPontos, setCarregandoPontos] = useState(true);
    const [erroPontos, setErroPontos] = useState<string | null>(null);

    const [tipoItem, setTipoItem] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [pontoDestinoId, setPontoDestinoId] = useState<string | null>(
        pontoIdInicial
    );
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState(false);
    const [doacoes, setDoacoes] = useState<Doacao[]>([]);

    useEffect(() => {
        async function carregarDados() {
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

            const doacoesSalvas = await listarDoacoes();
            setDoacoes(doacoesSalvas);
        }

        carregarDados();
    }, []);

    useEffect(() => {
        if (doacaoEditando) {
            setTipoItem(doacaoEditando.tipoItem);
            setQuantidade(doacaoEditando.quantidade.toString());
            setPontoDestinoId(doacaoEditando.pontoDestinoId);
        } else if (pontoIdInicial) {
            setPontoDestinoId(pontoIdInicial);
        }
    }, [doacaoEditando, pontoIdInicial]);

    async function validar() {
        setSucesso(false);

        if (tipoItem.trim() === '') {
            setErro('Informe o tipo do item.');
            return;
        }

        if (quantidade.trim() === '' || !/^\d+$/.test(quantidade.trim())) {
            setErro('Quantidade deve ser um número válido.');
            return;
        }

        if (!pontoDestinoId) {
            setErro('Selecione um ponto de destino.');
            return;
        }

        const pontoSelecionado = pontos.find((p) => p.id === pontoDestinoId);

        const novaDoacao: Doacao = {
            id: doacaoEditando?.id ?? Date.now(),
            tipoItem: tipoItem.trim(),
            quantidade: Number(quantidade),
            pontoDestinoId,
            pontoDestinoNome:
                pontoSelecionado?.nome ?? doacaoEditando?.pontoDestinoNome,
            criadoEm: doacaoEditando?.criadoEm ?? new Date().toISOString(),
        };

        if (modoEdicao) {
            await atualizarDoacao(novaDoacao);
            navigation.goBack();
            return;
        }

        await salvarDoacao(novaDoacao);
        const atualizadas = await listarDoacoes();
        setDoacoes(atualizadas);

        setErro('');
        setSucesso(true);

        setTipoItem('');
        setQuantidade('');
        setPontoDestinoId(null);

        Keyboard.dismiss();
    }

    function nomePonto(doacao: Doacao) {
        return (
            pontos.find((ponto) => ponto.id === doacao.pontoDestinoId)?.nome ??
            doacao.pontoDestinoNome ??
            'Ponto não encontrado'
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.teclado}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Text style={styles.titulo}>
                    {modoEdicao ? 'Editar doação' : 'Registrar doação'}
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
                            const selecionado = ponto.id === pontoDestinoId;

                            return (
                                <TouchableOpacity
                                    key={ponto.id}
                                    style={[
                                        styles.chipPonto,
                                        selecionado &&
                                            styles.chipPontoSelecionado,
                                    ]}
                                    onPress={() => {
                                        setPontoDestinoId(ponto.id);
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

                <TouchableOpacity style={styles.botao} onPress={validar}>
                    <Text style={styles.botaoTexto}>
                        {modoEdicao ? 'Salvar alterações' : 'Registrar doação'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botaoCancelar}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>

                <Text style={styles.tituloDoacoes}>Doações registradas</Text>

                <FlatList
                    data={doacoes}
                    keyExtractor={(item, index) =>
                        item.id?.toString() ?? index.toString()
                    }
                    renderItem={({ item }) => (
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
                    )}
                />
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
});
