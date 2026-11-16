import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ponto } from '../types/ponto';
import { buscarPorId, excluir } from '../services/pontosService';
import { ApiError } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalhePonto'>;

function TelaDetalhePonto({ route, navigation }: Props) {
    const id = route.params?.id;

    const [ponto, setPonto] = useState<Ponto | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [excluindo, setExcluindo] = useState(false);
    const [naoEncontrado, setNaoEncontrado] = useState(false);
    const [erroConexao, setErroConexao] = useState<string | null>(null);
    const [erroExclusao, setErroExclusao] = useState<string | null>(null);

    const carregarPonto = useCallback(async () => {
        if (!id) {
            setNaoEncontrado(true);
            setCarregando(false);
            return;
        }

        setCarregando(true);
        setNaoEncontrado(false);
        setErroConexao(null);

        try {
            const dados = await buscarPorId(id);
            setPonto(dados);
        } catch (erro) {
            if (erro instanceof ApiError && erro.status === 404) {
                setNaoEncontrado(true);
            } else {
                setErroConexao(
                    'Não foi possível carregar os dados do ponto. Verifique se a API está ativa.'
                );
            }
        } finally {
            setCarregando(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            carregarPonto();
        }, [carregarPonto])
    );

    async function executarExclusao() {
        if (!ponto || excluindo) return;

        setExcluindo(true);
        setErroExclusao(null);

        try {
            await excluir(ponto.id);
            navigation.goBack();
        } catch (erro) {
            const mensagem =
                erro instanceof ApiError
                    ? erro.message
                    : 'Não foi possível excluir o ponto. Verifique se a API está ligada e tente novamente.';
            setErroExclusao(mensagem);
            if (Platform.OS !== 'web') {
                Alert.alert('Erro ao excluir', mensagem);
            }
        } finally {
            setExcluindo(false);
        }
    }

    function confirmarExclusao() {
        if (!ponto || excluindo) return;

        if (Platform.OS === 'web') {
            const confirmou = window.confirm(
                `Deseja realmente excluir o ponto "${ponto.nome}"?`
            );
            if (confirmou) {
                executarExclusao();
            }
            return;
        }

        Alert.alert(
            'Excluir ponto',
            `Tem certeza que deseja excluir "${ponto.nome}"?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: executarExclusao,
                },
            ]
        );
    }

    if (carregando && !ponto) {
        return (
            <SafeAreaView style={styles.estadoCentral}>
                <ActivityIndicator size="large" color="#1B3A5C" />
                <Text style={styles.estadoTexto}>
                    Carregando detalhes do ponto...
                </Text>
            </SafeAreaView>
        );
    }

    if (naoEncontrado || (!ponto && !erroConexao)) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.titulo}>Ponto não encontrado</Text>

                <TouchableOpacity
                    style={styles.voltar}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (erroConexao && !ponto) {
        return (
            <SafeAreaView style={styles.estadoCentral}>
                <Text style={styles.erroTitulo}>Erro de conexão</Text>
                <Text style={styles.erroDescricao}>{erroConexao}</Text>

                <TouchableOpacity
                    style={styles.botaoPrincipal}
                    onPress={carregarPonto}
                >
                    <Text style={styles.botaoPrincipalTexto}>
                        Tentar novamente
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.voltar}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!ponto) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.conteudo}>
                <Text style={styles.titulo}>Detalhes do Ponto</Text>

                <View style={styles.card}>
                    <Text style={styles.nome}>{ponto.nome}</Text>

                    <Text style={styles.rotulo}>Endereço</Text>
                    <Text style={styles.valor}>{ponto.endereco}</Text>

                    <Text style={styles.rotulo}>Bairro</Text>
                    <Text style={styles.valor}>{ponto.bairro}</Text>

                    <Text style={styles.rotulo}>Horário de funcionamento</Text>
                    <Text style={styles.valor}>{ponto.horario}</Text>

                    <Text style={styles.rotulo}>Tipo de atendimento</Text>
                    <Text style={styles.tipoValor}>{ponto.tipo}</Text>
                </View>

                {erroExclusao !== null && (
                    <View style={styles.caixaErro}>
                        <Text style={styles.textoErro}>{erroExclusao}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.botaoEditar}
                    onPress={() =>
                        navigation.navigate('CadastroPonto', { ponto })
                    }
                    disabled={excluindo}
                >
                    <Text style={styles.botaoEditarTexto}>Editar ponto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.botaoExcluir,
                        excluindo && styles.botaoDesabilitado,
                    ]}
                    onPress={confirmarExclusao}
                    disabled={excluindo}
                >
                    {excluindo ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.botaoExcluirTexto}>
                            Excluir ponto
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botaoPrincipal}
                    onPress={() =>
                        navigation.navigate('CadastroDoacao', {
                            pontoId: ponto.id,
                        })
                    }
                    disabled={excluindo}
                >
                    <Text style={styles.botaoPrincipalTexto}>
                        Registrar doação neste ponto
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.voltar}
                    onPress={() => navigation.goBack()}
                    disabled={excluindo}
                >
                    <Text style={styles.voltarTexto}>Voltar para a lista</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

export default TelaDetalhePonto;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    conteudo: {
        padding: 20,
        paddingBottom: 32,
    },
    estadoCentral: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
    },
    estadoTexto: {
        marginTop: 12,
        fontSize: 15,
        color: '#555555',
    },
    titulo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginBottom: 16,
    },
    card: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 16,
        backgroundColor: '#FAFAFA',
    },
    nome: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginBottom: 8,
    },
    rotulo: {
        fontSize: 13,
        color: '#757575',
        marginTop: 12,
        marginBottom: 2,
    },
    valor: {
        fontSize: 16,
        color: '#222222',
    },
    tipoValor: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
        textTransform: 'capitalize',
    },
    caixaErro: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#EF9A9A',
    },
    textoErro: {
        color: '#B71C1C',
        fontSize: 14,
    },
    erroTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C62828',
        marginBottom: 8,
    },
    erroDescricao: {
        fontSize: 14,
        color: '#4A4A4A',
        textAlign: 'center',
        marginBottom: 16,
    },
    botaoEditar: {
        marginTop: 20,
        backgroundColor: '#1B3A5C',
        borderRadius: 8,
        minHeight: 46,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoEditarTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    botaoExcluir: {
        marginTop: 10,
        backgroundColor: '#C62828',
        borderRadius: 8,
        minHeight: 46,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoExcluirTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    botaoDesabilitado: {
        opacity: 0.7,
    },
    botaoPrincipal: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#1B3A5C',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        minHeight: 46,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoPrincipalTexto: {
        color: '#1B3A5C',
        fontWeight: 'bold',
        fontSize: 15,
    },
    voltar: {
        marginTop: 14,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignSelf: 'flex-start',
    },
    voltarTexto: {
        color: '#1B3A5C',
        fontWeight: 'bold',
    },
});
