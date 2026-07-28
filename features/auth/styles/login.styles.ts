import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1EEE4", // Warm Beige background
  },
  circleHeader: {
    position: "absolute",
    width: 530,
    height: 530,
    borderRadius: 265,
    backgroundColor: "#C5F347", // Lime Green accent circle
    top: -270,
    alignSelf: "center",
  },
  headerContainer: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoWrapper: {
    width: 34,
    height: 34,
    position: "relative",
  },
  logoBackCard: {
    position: "absolute",
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#10201B",
    left: 0,
    bottom: 0,
  },
  logoFrontCard: {
    position: "absolute",
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#10201B",
    right: 0,
    top: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#10201B",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6F6F68",
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "center",
  },
  formScroll: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    color: "#6F6F68",
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderColor: "#DCDED2",
    fontSize: 15,
    color: "#10201B",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: "#10201B",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DCDED2",
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: "#9A9A90",
    fontWeight: "600",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 20,
  },
  socialButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ECEEE4",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#6F6F68",
    fontWeight: "600",
    marginTop: 8,
  },
  footerTextLink: {
    color: '#10201B',
    fontWeight: '700',
  },
  termsText: {
    textAlign: "center",
    fontSize: 11,
    color: "#9A9A90",
    fontWeight: "500",
    marginVertical: 16,
    lineHeight: 16,
  },
});
