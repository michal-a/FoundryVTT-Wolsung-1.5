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
- Inicjatywa losowana poprzez ciągniecie kart w każdej turze. Możliwość użycia karty z ręki by zastąpić kartę inicjatywy (poprzez prawoklik lub przeciągnięcie).
- Komenda /wss rozdająca karty i żetony na rozpoczęcie sesji
- Obsługa rzutów według zasad Wolsunga wraz z traktowaniem przerzutu jako 10. Rzuty dostępne są z karty postaci, karty obsady oraz chatu poprzez komendę /wr. Dice so Nice jest również obsługiwany.
- Modyfikowanie rzutów kartami i żetonami poprzez kliknięciem prawym przyciskiem na wiadomość w Chacie lub przeciągnięcie karty/żetonu na wiadomość. UWAGA: wymaga zainstalowania modułu _socketlib_ i aktywowania go w ustawieniach.
- Trzy typy konfrontacji wyświetlające oraz możliwość wyboru konfrontacji Va Banque. Zmienia to wyświetlany typ Obrony (Obrona, Wytrwałość i Pewność Siebie) w _Combat Tracker_. Ponadto automatyczne wyliczanie odporności bohaterów (_Actor_ w typi _bohater_), które można wyłączyć w ustawieniach.
- Automatyczne tworzenie się rąk z kartami dla graczy i MG.
- Instrukcje dla graczy oraz MG dostępne w Compendium.

### Tworzenie nowej gry
Po utworzeniu nowej gry należy w System Settings podać liczbę graczy nie licząc MG (jest to potrzebne do wyliczania kart na ręce MG).

### Funkcje karty postaci bohatera
- Blizny, Atuty, Zdolności (poprzez zdolności rozumiem zdolności z profesji, rasy oraz słabości), Gadżety, Moce, Zaklęcia oraz Osiągnięcia mogą być dodawanie poprzez przycisk +. Można je otworzyć lub zmodyfikować poprzez kliknięcie w ich nazwę. Aby je usunąć należy kliknąć prawym przyciskiem w nazwę i wybrać Usuń. Można je również wypisać na chat poprzez menu z prawego kliknięcia lub poprzez kliknięcie przytrzymując CTRL. Powyższe można również przeciągać z kompendium czy z i do zakładki Items. Uwaga, system nie posiada żadnej automatyzacji w kontekście cech np. atutu czy gadżetu.
- Umiejętności można testować poprzez kliknięcie w nazwe umiejętności. Jeśli wpisana jest specjalizacja liczba po prawej stronie od nazwy specjalizacji jest klikalna i pozwala na wykonanie testu specjalizacji. Domyślnie otwiera się okno dialogowe, gdzie można zmodyfikować parametru testu (np. dodając modyfikator, czy zmienić liczbę kości). Szybki test bez otwierania okna dialogowego jest możliwy poprzez kliknięcie przytrzymując klawisz SHIFT.
- Bogactwo można testować klikając w nagłówek Bogactwo
- Przycisk Konfrontacja pozwala wygenerować Odporność postaci w zależności od wybranego typu konfrontacji.

### Karta obsady
Karta obsady posiada Zdolnośći oraz listę umiejętności z podziałem na typ konfrontacji oraz umiejętności ogólne. Testowanie umiejętności odbywa się poprzez przycisk dwóch kostek na lewo od nazwy umiejętności.

### Karty na ręku gracza/MG
Karty można wykorzystywać w następujący sposób:
- Użyć poprzez wypisanie na chat (menu pod prawym przyciskiem lub przeciągnięcie karty na stół): wartość karty oraz jej bonusy zostaną wypisane na chacie
- Odrzucić (menu pod prawym przycikiem): karta zostanie odrzucona z ręki
- Wykorzystywać za inicjatywę (menu pod prawym przycikiem): jeżeli jest aktywny Encounter pozwala podmienić inicjatywę kontrolowanemu tokenowi
- Zmodyfikować wynik rzutu (menu po kliknięciu prawym przyciskiem na wiadomość lub przeciągnięcie karty na wiadomość)

### Żetony na ręku gracza/MG
Pozwalają na:
- Użycie poprzez wypisanie na chat (menu pod prawym przyciskiem lub przeciągnięcie żetonu na stół): ten fakt zostaje odnotowany na chacie
- Dociągnięcie kart  (menu pod prawym przycikiem): dociąga karty do maksymalnej liczby kart gracza/MG
- Zmodyfikować wynik rzutu (menu po kliknięciu prawym przyciskiem na wiadomość lub przeciągnięcie żetonu na wiadomość)

### Rozpoczęcie sesji - komenda `/wss`
Pisząc na czacie komendę `/wss` MG może szybko przygotować karty i żetony na rękach graczy. Komenda wykonuje następujące czynności:
1. Resetuje wszystkie kart do oryginalnych decków oraz tasuje je.
2. Rozdaje po 3 karty i 6 żetonów na ręce graczy
3. Rozdaje MG liczbę kart i żetonów zależną od liczby graczy zdefiniowanej w ustawieniach.
Komendę `/wss` można również użyć definując ręce graczy jako argumenty w celu pominięcia, któregoś z graczy:
`/wss "ręka Gracza1" "ręka gracza3"`

### Rzut kośćmi - komenda `/wr`
Rzuty można wykonywać również poprzez komendę `/wr`. Pisząc na czacie np.
`/wr 2d8 + 6`
Wykonujemy rzut 2 kośćmi z umiejętnością 6/8+

## UWAGI
System jest wersją bez dokładnych testów, także mogą pojawiać się błędy. Wszelkie uwagi oraz zgłoszenia błędów są mile widziane.
Moduły modyfikujące zachowanie kart nie będą działały z tym systemem.

