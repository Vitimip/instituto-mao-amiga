import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { ApiError } from '../services/api';
import { cadastrar, editar } from '../services/pontosService';

type Props = NativeStackScreenProps<RootStackParamList, 'CadastroPonto'>;
type TipoSelecionado = 'coleta' | 'distribuição' | null;

function normalizarTipo(valor?: string): TipoSelecionado {
    if (!valor) return null;
    const limpo = valor.trim().toLowerCase();
    if (limpo === 'coleta') return 'coleta';
    if (limpo === 'distribuição' || limpo === 'distribuicao') {
        return 'distribuição';
    }
    return null;
}

export default function TelaCadastroPonto({ route, navigation }: Props) {
    const pontoEditando = route.params?.ponto;
    const modoEdicao = !!pontoEditando;

    const [nome, setNome] = useState(pontoEditando?.nome ?? '');
    const [endereco, setEndereco] = useState(pontoEditando?.endereco ?? '');
    const [bairro, setBairro] = useState(pontoEditando?.bairro ?? '');
    const [horario, setHorario] = useState(pontoEditando?.horario ?? '');
    const [tipo, setTipo] = useState<TipoSelecionado>(
        normalizarTipo(pontoEditando?.tipo)
    );

    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (pontoEditando) {
            setNome(pontoEditando.nome);
            setEndereco(pontoEditando.endereco);
            setBairro(pontoEditando.bairro);
            setHorario(pontoEditando.horario);
            setTipo(normalizarTipo(pontoEditando.tipo));
        }
    }, [pontoEditando]);

    function formatarMensagemErro(err: unknown): string {
        if (err instanceof ApiError) {
            const corpo = err.body as
                | {
                      mensagem?: string;
                      campos?: Record<string, string>;
                  }
                | undefined;

            if (corpo?.campos && Object.keys(corpo.campos).length > 0) {
                const detalhes = Object.values(corpo.campos).join('\n');
                return `${corpo.mensagem || 'Dados inválidos'}:\n${detalhes}`;
            }

            if (err.status === 400) {
                return (
                    corpo?.mensagem ||
                    'A API recusou os dados enviados (400). Revise os campos e tente novamente.'
                );
            }

            if (err.status === 404) {
                return 'Ponto não encontrado na API. Ele pode ter sido removido.';
            }

            return err.message;
        }

        return 'Não foi possível conectar ao servidor. Verifique se a API está ligada e tente novamente.';
    }

    async function salvar() {
        if (enviando) return;

        // Validação no app antes de enviar: nenhum campo vazio
        if (nome.trim() === '') {
            setErro('Informe o nome do ponto.');
            return;
        }
        if (endereco.trim() === '') {
            setErro('Informe o endereço do ponto.');
            return;
        }
        if (bairro.trim() === '') {
            setErro('Informe o bairro do ponto.');
            return;
        }
        if (horario.trim() === '') {
            setErro('Informe o horário de funcionamento.');
            return;
        }
        if (!tipo) {
            setErro('Selecione o tipo do ponto ("coleta" ou "distribuição").');
            return;
        }

        setErro(null);
        setEnviando(true);
        Keyboard.dismiss();

        const payload = {
            nome: nome.trim(),
            endereco: endereco.trim(),
            bairro: bairro.trim(),
            horario: horario.trim(),
            tipo,
        };

        try {
            if (modoEdicao && pontoEditando) {
                await editar(pontoEditando.id, payload);
            } else {
                await cadastrar(payload);
            }

            // Só volta para a tela anterior se a API confirmar sucesso
            navigation.goBack();
        } catch (err) {
            // Mantém tudo o que foi digitado e exibe mensagem clara de erro
            setErro(formatarMensagemErro(err));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.teclado}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.conteudo}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.titulo}>
                        {modoEdicao ? 'Editar ponto' : 'Cadastrar ponto'}
                    </Text>

                    <Text style={styles.rotulo}>Nome</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex.: Mão Amiga - Setor Bueno"
                        placeholderTextColor="#9E9E9E"
                        value={nome}
                        onChangeText={(texto) => {
                            setNome(texto);
                            if (erro) setErro(null);
                        }}
                        editable={!enviando}
                        maxLength={100}
                        returnKeyType="next"
                    />

                    <Text style={styles.rotulo}>Endereço</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex.: Av. T-10, 1200"
                        placeholderTextColor="#9E9E9E"
                        value={endereco}
                        onChangeText={(texto) => {
                            setEndereco(texto);
                            if (erro) setErro(null);
                        }}
                        editable={!enviando}
                        maxLength={200}
                        returnKeyType="next"
                    />

                    <Text style={styles.rotulo}>Bairro</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex.: Setor Bueno"
                        placeholderTextColor="#9E9E9E"
                        value={bairro}
                        onChangeText={(texto) => {
                            setBairro(texto);
                            if (erro) setErro(null);
                        }}
                        editable={!enviando}
                        maxLength={100}
                        returnKeyType="next"
                    />

                    <Text style={styles.rotulo}>Horário</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex.: Seg a Sex, 8h às 17h"
                        placeholderTextColor="#9E9E9E"
                        value={horario}
                        onChangeText={(texto) => {
                            setHorario(texto);
                            if (erro) setErro(null);
                        }}
                        editable={!enviando}
                        maxLength={100}
                        returnKeyType="done"
                    />

                    <Text style={styles.rotulo}>Tipo</Text>
                    <View style={styles.grupoTipo}>
                        <TouchableOpacity
                            style={[
                                styles.opcaoTipo,
                                tipo === 'coleta' &&
                                    styles.opcaoTipoColetaAtiva,
                            ]}
                            onPress={() => {
                                setTipo('coleta');
                                if (erro) setErro(null);
                            }}
                            disabled={enviando}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.opcaoTipoTexto,
                                    tipo === 'coleta' &&
                                        styles.opcaoTipoTextoAtivo,
                                ]}
                            >
                                Coleta
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.opcaoTipo,
                                tipo === 'distribuição' &&
                                    styles.opcaoTipoDistribuicaoAtiva,
                            ]}
                            onPress={() => {
                                setTipo('distribuição');
                                if (erro) setErro(null);
                            }}
                            disabled={enviando}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.opcaoTipoTexto,
                                    tipo === 'distribuição' &&
                                        styles.opcaoTipoTextoAtivo,
                                ]}
                            >
                                Distribuição
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {erro !== null && (
                        <View style={styles.caixaErro}>
                            <Text style={styles.textoErro}>{erro}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.botaoSalvar,
                            enviando && styles.botaoDesabilitado,
                        ]}
                        onPress={salvar}
                        disabled={enviando}
                        activeOpacity={0.8}
                    >
                        {enviando ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.botaoSalvarTexto}>
                                {modoEdicao
                                    ? 'Salvar alterações'
                                    : 'Cadastrar ponto'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.botaoCancelar}
                        onPress={() => navigation.goBack()}
                        disabled={enviando}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                    </TouchableOpacity>
                </ScrollView>
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
    },
    conteudo: {
        padding: 16,
        paddingBottom: 32,
    },
    titulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B3A5C',
        marginBottom: 8,
    },
    rotulo: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555555',
        marginTop: 14,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#BDBDBD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#222222',
        backgroundColor: '#FAFAFA',
    },
    grupoTipo: {
        flexDirection: 'row',
        gap: 10,
    },
    opcaoTipo: {
        flex: 1,
        minHeight: 46,
        borderWidth: 1.5,
        borderColor: '#BDBDBD',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    opcaoTipoColetaAtiva: {
        backgroundColor: '#1565C0',
        borderColor: '#1565C0',
    },
    opcaoTipoDistribuicaoAtiva: {
        backgroundColor: '#2E7D32',
        borderColor: '#2E7D32',
    },
    opcaoTipoTexto: {
        fontSize: 15,
        fontWeight: '600',
        color: '#424242',
    },
    opcaoTipoTextoAtivo: {
        color: '#FFFFFF',
        fontWeight: 'bold',
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
        lineHeight: 20,
    },
    botaoSalvar: {
        backgroundColor: '#1B3A5C',
        borderRadius: 8,
        minHeight: 48,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    botaoDesabilitado: {
        opacity: 0.7,
    },
    botaoSalvarTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
    botaoCancelar: {
        borderWidth: 1,
        borderColor: '#1B3A5C',
        borderRadius: 8,
        minHeight: 46,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    botaoCancelarTexto: {
        color: '#1B3A5C',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
