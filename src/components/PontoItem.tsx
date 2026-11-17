import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ponto } from '../types/ponto';
import { ehFavorito, toggleFavorito } from '../storage/favoritosStorage';

type Props = {
    ponto: Ponto;
    onPress: () => void;
    onToggleFavorito?: (id: string) => void;
    refreshKey?: number;
};

export default function PontoItem({ ponto, onPress, onToggleFavorito, refreshKey }: Props) {
    const isColeta = ponto.tipo.toLowerCase() === 'coleta';
    const [favorito, setFavorito] = useState(false);

    const recarregarFavorito = () => {
        ehFavorito(ponto.id).then(setFavorito);
    };

    useEffect(() => {
        recarregarFavorito();
    }, [ponto.id, refreshKey]);

    async function handleFavorito(e: any) {
        e.stopPropagation();
        const novaLista = await toggleFavorito(ponto.id);
        setFavorito(novaLista.includes(ponto.id));
        onToggleFavorito?.(ponto.id);
    }

    return (
        <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
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
                <TouchableOpacity
                    style={styles.botaoFavorito}
                    onPress={handleFavorito}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.6}
                >
                    <Text style={styles.iconeFavorito}>
                        {favorito ? '♥' : '♡'}
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.endereco}>
                {ponto.endereco} — {ponto.bairro}
            </Text>

            <Text style={styles.horario}>Horário: {ponto.horario}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    item: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
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
    botaoFavorito: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    iconeFavorito: {
        fontSize: 24,
        color: '#E53935',
    },
});
