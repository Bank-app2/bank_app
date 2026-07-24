import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F1EEE4",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#10201B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#10201B99",
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    color: "#10201B99",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DAD5C6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 18,
    color: "#10201B",
  },
  button: {
    backgroundColor: "#2F5D50",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#F1EEE4",
    fontSize: 15,
    fontWeight: "600",
  },
});