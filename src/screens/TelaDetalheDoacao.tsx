import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Doacao } from '../types/doacao';
import { ApiError } from '../services/api';
import { buscarPorId, excluir } from '../services/doacoesService';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalheDoacao'>;

export default function TelaDetalheDoacao({ route, navigation }: Props) {
    const { id } = route.params;

    const [doacao, setDoacao] = useState<Doacao | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        async function carregar() {
            setCarregando(true);
            setErro(null);
            try {
                const dados = await buscarPorId(id);
                setDoacao(dados);
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) {
                    setErro('Doação não encontrada.');
                } else {
                    setErro(
                        'Não foi possível carregar a doação. Verifique se o servidor está ligado.'
                    );
                }
            } finally {
                setCarregando(false);
            }
        }

        carregar();
    }, [id]);

    const handleEditar = useCallback(() => {
        if (doacao) {
            navigation.navigate('CadastroDoacao', { doacao });
        }
    }, [doacao, navigation]);

    const handleExcluir = useCallback(() => {
        setMostrarModalExcluir(true);
    }, []);

    const handleConfirmarExcluir = useCallback(async () => {
        setExcluindo(true);
        try {
            await excluir(id);
            navigation.goBack();
        } catch (e) {
            if (e instanceof ApiError) {
                Alert.alert(
                    'Erro',
                    e.message ??
                        'Não foi possível excluir a doação. Tente novamente.'
                );
            } else {
                Alert.alert(
                    'Erro',
                    'Erro inesperado ao excluir a doação. Tente novamente.'
                );
            }
        } finally {
            setExcluindo(false);
            setMostrarModalExcluir(false);
        }
    }, [id, navigation]);

    const handleCancelarExcluir = useCallback(() => {
        setMostrarModalExcluir(false);
    }, []);

    if (carregando) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centro}>
                    <Text style={styles.mensagem}>Carregando doação...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (erro !== null || doacao === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centro}>
                    <Text style={styles.mensagemErro}>
                        {erro ?? 'Doação não encontrada.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.botao}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.botaoTexto}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.titulo}>Detalhe da doação</Text>

            <View style={styles.card}>
                <Text style={styles.rotulo}>Tipo do item</Text>
                <Text style={styles.valor}>{doacao.tipoItem}</Text>

                <Text style={styles.rotulo}>Quantidade</Text>
                <Text style={styles.valor}>{doacao.quantidade}</Text>

                <Text style={styles.rotulo}>Ponto de destino</Text>
                <Text style={styles.valor}>
                    {doacao.pontoDestino ?? 'Ponto não encontrado'}
                </Text>

                <Text style={styles.rotulo}>Data do registro</Text>
                <Text style={styles.valor}>
                    {new Date(doacao.criadoEm).toLocaleString('pt-BR')}
                </Text>
            </View>

            <View style={styles.botoesContainer}>
                <TouchableOpacity
                    style={[styles.botao, styles.botaoEditar]}
                    onPress={handleEditar}
                >
                    <Text style={styles.botaoEditarTexto}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.botao, styles.botaoExcluir]}
                    onPress={handleExcluir}
                >
                    <Text style={styles.botaoExcluirTexto}>Excluir</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={mostrarModalExcluir}
                transparent
                animationType="fade"
                onRequestClose={handleCancelarExcluir}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Excluir doação</Text>
                        <Text style={styles.modalMessage}>
                            Tem certeza que deseja excluir esta doação?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={handleCancelarExcluir}
                                disabled={excluindo}
                            >
                                <Text style={styles.modalButtonCancelText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonDelete]}
                                onPress={handleConfirmarExcluir}
                                disabled={excluindo}
                            >
                                <Text style={styles.modalButtonDeleteText}>
                                    {excluindo ? 'Excluindo...' : 'Excluir'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 16,
    },
    card: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 16,
    },
    rotulo: {
        fontSize: 13,
        color: '#757575',
        marginTop: 10,
        marginBottom: 4,
    },
    valor: {
        fontSize: 16,
        color: '#222222',
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
    },
    mensagemErro: {
        fontSize: 16,
        color: '#C62828',
        textAlign: 'center',
        marginBottom: 16,
    },
    botoesContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    botao: {
        flex: 1,
        borderRadius: 8,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoEditar: {
        backgroundColor: '#1B3A5C',
    },
    botaoEditarTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    botaoExcluir: {
        backgroundColor: '#C62828',
    },
    botaoExcluirTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    botaoTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: '#555555',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        borderRadius: 8,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        borderWidth: 1,
        borderColor: '#1B3A5C',
    },
    modalButtonCancelText: {
        color: '#1B3A5C',
        fontWeight: 'bold',
    },
    modalButtonDelete: {
        backgroundColor: '#C62828',
    },
    modalButtonDeleteText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
