// Alt+1-7 keyboard navigation with ViewTransitions
document.addEventListener("keydown", async (event) => {
  if (event.altKey) {
    let targetUrl = null;

    switch (event.key) {
      case "1":
        targetUrl = "/";
        break;
      case "2":
        targetUrl = "/about/";
        break;
      case "3":
        targetUrl = "/projects/";
        break;
      case "4":
        targetUrl = "/quotes/";
        break;
      case "5":
        targetUrl = "/bookbits/";
        break;
      case "6":
        targetUrl = "/resume/";
        break;
      case "7":
        targetUrl = "/tutorials/";
        break;
    }

    if (targetUrl && targetUrl !== window.location.pathname) {
      event.preventDefault();
      // Use ViewTransitions navigate() for animated page changes
      const { navigate } = await import("astro:transitions/client");
      navigate(targetUrl);
    }
  }
});
