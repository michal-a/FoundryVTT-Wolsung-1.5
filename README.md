# Foundry-VTT-Wolsung-1.5
This is a Wolsung 1.5 unofficial implementation for Foundry VTT. There is no content of the Wolsung Book except cards effects for archetypes from the Jazda Próbna. The system is written in Polish as the rest of README.

## ACTOR TYPES
- Bohater (bohaterowie graczy, pełna karta postaci)
- Obsada (obsada w tym przeciwnicy, statyści i sojusznicy)
- BN (bohaterowie niezależni, którzy nie posiadają statystyk)

## ITEM TYPES
- Atut
- Zdolność
- Gadżet
- Moc
- Zaklęcie
- Osiągniecie
- Blizna
- Umiejętność obsady

## FEATURES
- Obsługa kart i żetonów do Wolsunga.
- Inicjatywa losowana poprzez ciągniecie kart w każdej turze. Możliwość użycia karty z ręki by zastąpić kartę inicjatywy.
- Komenda /wss rozdająca karty i żetony na rozpoczęcie sesji
- Obsługa rzutów według zasad Wolsunga wraz z traktowaniem przerzutu jako 10. Rzuty dostępne są z karty postaci, karty obsady oraz chatu poprzez komendę /wr. Dice so Nice jest również obsługiwany.

### Tworzenie nowej gry
Po utworzeniu nowej gry należy dokonać wstępnej konfiguracji:
1. Zaimportować Cards for Wolsung z Compendium najlepiej poprzez Import All Content
2. W System Settings podać liczbę graczy nie licząc MG (jest to potrzebne do wyliczania kart na ręce MG).
3. Utworzyć Card Stack, typ Hand dla każdego gracza oraz MG. Card Stack danego gracza powinien należeć do niego (Configure Permissions).

### Funkcje karty postaci bohatera
![Karta postaci](https://lh3.googleusercontent.com/ttvHefmOuA46_qcei7GqtqM4r9suTAHfCJJPl-A31UCNhxH8sE9zwfPKGrxL_lY4NfFolZZEbKFQZfMiVoRToIG94erAnJYFKNWSlSMFrcbPOdT79evBU10iwgAso4y9igmZRX11LkQ=w2400)
- Blizny, Atuty, Zdolności (poprzez zdolności rozumiem zdolności z profesji, rasy oraz słabości), Gadżety, Moce, Zaklęcia oraz Osiągnięcia mogą być dodawanie poprzez przycisk +. Można je otworzyć lub zmodyfikować poprzez kliknięcie w ich nazwę. Aby je usunąć należy kliknąć prawym przyciskiem w nazwę i wybrać Usuń. Powyższe można również przeciągać z kompendium czy zakładki Items. Uwaga, system nie posiada żadnej automatyzacji w kontekście cech np. atutu czy gadżetu.
- Umiejętności można testować poprzez kliknięcie w nazwe umiejętności. Jeśli wpisana jest specjalizacja liczba po prawej stronie od nazwy specjalizacji pozwala na wykonanie testu specjalizacji. Domyślnie otwiera się okno dialogowe, gdzie można zmodyfikować parametru testu (np. dodając modyfikator, czy zmienić liczbę kości). Szybki test bez otwierania okna dialogowego jest możliwy poprzez kliknięcie przytrzymując klawisz SHIFT.
- Bogactwo można testować klikając w nagłówek Bogactwo
- Przycisk Konfrontacja pozwala wygenerować Odporność postaci w zależności od wybranego typu konfrontacji.

### Karta obsady
Karta obsady posiada Zdolnośći oraz listę umiejętności z podziałem na typ konfrontacji oraz umiejętności ogólne. Testowanie umiejętności odbywa się poprzez przycisk dwóch kostek na lewo od nazwy umiejętności.

### Karty na ręku gracza/MG
Karty można wykorzystywać w następujący sposób:
- Używać: wartość karty oraz jej bonusy zostaną wypisane na chacie
- Odrzucić: karta zostanie odrzucona z ręki
- Wykorzystywać za inicjatywę: jeżeli jest aktywny Encounter pozwala podmienić inicjatywę kontrolowanemu tokenowi

### Żetony na ręku gracza/MG
Pozwalają na:
- Użycie: ten fakt zostaje odnotowany na chacie
- Dociągnięcie kart: dociąga karty do maksymalnej liczby kart gracza/MG

### Rozpoczęcie sesji - komenda `/wss`
Pisząc na czacie komendę `/wss` MG może szybko przygotować karty i żetony na rękach graczy. Komenda wykonuje następujące czynności:
1. Resetuje wszystkie kart do oryginalnych decków oraz tasuje je.
2. Rozdaje po 3 karty i 6 żetonów na ręce graczy (ręka gracza jest ręką, którą posiada przynajmniej jeden gracz)
3. Rozdaje MG liczbę kart i żetonów zależną od liczby graczy zdefiniowanej w ustawieniach. Ręka MG to ręka nie posiadana przez żadnego z graczy.
Komendę `/wss` można również użyć definując ręce graczy jako argumenty:
`/wss "ręka MG" "ręka Gracza1" "ręka gracza2"`

### Rzut kośćmi - komenda `/wr`
Rzuty można wykonywać również poprzez komendę `/wr`. Pisząc na czacie np.
`/wr 2d8 + 6`
Wykonujemy rzut 2 kośćmi z umiejętnością 6/8+

## UWAGI
System jest wersją bez dokładnych testów, także mogą pojawiać się błędy. Wszelkie uwagi oraz zgłoszenia błędów są mile widziane.

