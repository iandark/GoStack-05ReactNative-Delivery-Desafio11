import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const response = await api.get(`/foods/${routeParams.id}`);
      const gotFood: Food = response.data;

      const favorited = await api.get('favorites');
      const gotFavorites = favorited.data.filter((favorite: Food) => {
        if (favorite.name === gotFood.name) {
          return favorite;
        }
      });

      setIsFavorite(!!gotFavorites.length);

      const foodWithFormattedPrice = {
        ...gotFood,
        formattedPrice: formatValue(gotFood.price),
      };
      setFood(foodWithFormattedPrice);

      const extrasWithQuantity = response.data.extras.map((extra: Extra) => ({
        ...extra,
        quantity: 0,
      }));

      setExtras(extrasWithQuantity);
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function loadFavorite(): Promise<void> {
      const favorited = await api.get('favorites');
      const gotFavorites = favorited.data.filter((favorite: Food) => {
        if (favorite.name === food.name) {
          return favorite;
        }
      });

      setIsFavorite(!!gotFavorites.length);
    }

    loadFavorite();
  }, [routeParams.id, food.name]);

  function handleIncrementExtra(id: number): void {
    const incrementedExtras = extras.map(extra =>
      extra.id === id
        ? {
            ...extra,
            quantity: extra.quantity + 1,
          }
        : extra,
    );

    setExtras(incrementedExtras);
  }

  function handleDecrementExtra(id: number): void {
    const extraFound = extras.find(extra => extra.id === id);

    if (!extraFound) return;
    if (extraFound.quantity === 0) return;

    const decrementedExtras = extras.map(extra =>
      extra.id === id
        ? {
            ...extra,
            quantity: extra.quantity - 1,
          }
        : extra,
    );

    setExtras(decrementedExtras);
  }

  function handleIncrementFood(): void {
    const incrementedQuantity = foodQuantity + 1;

    setFoodQuantity(incrementedQuantity);
  }

  function handleDecrementFood(): void {
    if (foodQuantity === 1) {
      return;
    }
    const decrementedQuantity = foodQuantity - 1;

    setFoodQuantity(decrementedQuantity);
  }

  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      await api.delete(`/favorites/${food.id}`);
    } else {
      await api.post('favorites', food);
    }

    setIsFavorite(state => !state);
  }, [food, isFavorite]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal

    const extrasTotal = extras.reduce(
      (accumulator, extra) => accumulator + extra.quantity * extra.value,
      0,
    );
    const foodTotal = food.price;

    return formatValue((extrasTotal + foodTotal) * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const orders = await api.get('orders');

    const finalOrder = {
      ...food,
      id: orders.data.length + 1,
      product_id: food.id,
      quantity: foodQuantity,
      formattedValue: cartTotal,
      extras,
    };

    await api.post('orders', finalOrder);
    navigation.goBack();
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
