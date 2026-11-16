import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TelaListaPontos from './src/screens/TelaListaPontos';
import TelaDetalhePonto from './src/screens/TelaDetalhePonto';
import TelaCadastroPonto from './src/screens/TelaCadastroPonto';
import TelaCadastroDoacao from './src/screens/TelaCadastroDoacao';
import TelaMinhasDoacoes from './src/screens/TelaMinhasDoacoes';
import TelaDetalheDoacao from './src/screens/TelaDetalheDoacao';
import { Doacao } from './src/storage/doacoesStorage';
import { Ponto } from './src/types/ponto';

export type RootStackParamList = {
    ListaPontos: undefined;
    DetalhePonto: { id: string };
    CadastroPonto:
        | {
              ponto?: Ponto;
          }
        | undefined;
    CadastroDoacao:
        | {
              pontoId?: string;
              doacao?: Doacao;
          }
        | undefined;
    MinhasDoacoes: undefined;
    DetalheDoacao: { doacao: Doacao };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="ListaPontos">
                    <Stack.Screen
                        name="ListaPontos"
                        component={TelaListaPontos}
                        options={{ title: 'Pontos Mão Amiga' }}
                    />
                    <Stack.Screen
                        name="DetalhePonto"
                        component={TelaDetalhePonto}
                        options={{ title: 'Detalhe do Ponto' }}
                    />
                    <Stack.Screen
                        name="CadastroPonto"
                        component={TelaCadastroPonto}
                        options={({ route }) => ({
                            title: route.params?.ponto
                                ? 'Editar Ponto'
                                : 'Novo Ponto',
                        })}
                    />
                    <Stack.Screen
                        name="CadastroDoacao"
                        component={TelaCadastroDoacao}
                        options={{ title: 'Registrar Doação' }}
                    />
                    <Stack.Screen
                        name="MinhasDoacoes"
                        component={TelaMinhasDoacoes}
                        options={{ title: 'Minhas Doações' }}
                    />
                    <Stack.Screen
                        name="DetalheDoacao"
                        component={TelaDetalheDoacao}
                        options={{ title: 'Detalhe da Doação' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

export default App;
