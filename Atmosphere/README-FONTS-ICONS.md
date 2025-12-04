Fonts & Icons setup

1. Pacifico font (logo)

- Download `Pacifico-Regular.ttf` from Google Fonts (https://fonts.google.com/specimen/Pacifico).
- Create folder `./assets/fonts/` in the project root and place `Pacifico-Regular.ttf` there.
- Run:

```bash
npx react-native-asset
# or (older)
# npx react-native link
```

- Rebuild the app:

```bash
npm run android
# or
npm run ios
```

2. Vector icons

- Install:

```bash
npm install react-native-vector-icons
```

- For Android: autolinking should work. If not, follow the library README to add to `android/app/build.gradle` and the `MainApplication.java`.
- For iOS: after installing pods:

```bash
cd ios && pod install
```

3. Replace text-based icons with `react-native-vector-icons`. Example:

```tsx
import Icon from 'react-native-vector-icons/FontAwesome';

<Icon name="facebook" size={18} color="#1877F2" />;
```

Notes:

- If you want, I can add `Pacifico-Regular.ttf` to the repo and wire everything automatically.

4. AsyncStorage (persistent token storage)

- Install AsyncStorage package:

```bash
npm install @react-native-async-storage/async-storage
```

- For iOS run pods:

```bash
cd ios && pod install
```

The app code stores `token` and `user` in AsyncStorage after successful login/signup. Make sure to install the package and rebuild the app.
