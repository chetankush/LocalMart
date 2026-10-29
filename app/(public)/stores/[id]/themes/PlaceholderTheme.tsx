import DefaultTheme from "./DefaultTheme";

type PlaceholderThemeProps = React.ComponentProps<typeof DefaultTheme>;

export default function PlaceholderTheme(props: PlaceholderThemeProps) {
  return <DefaultTheme {...props} />;
}
