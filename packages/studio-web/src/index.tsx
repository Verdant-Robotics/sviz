import * as Sentry from "@sentry/browser";
import { StrictMode, useEffect } from "react";
import ReactDOM from "react-dom";

import Logger from "@foxglove/log";
import { setReportErrorHandler, type IDataSourceFactory } from "@foxglove/studio-base";
import CssBaseline from "@foxglove/studio-base/components/CssBaseline";

import { canRenderApp } from "./canRenderApp";

const log = Logger.getLogger(__filename);

function LogAfterRender(props: React.PropsWithChildren): JSX.Element {
  useEffect(() => {
    // Integration tests look for this console log to indicate the app has rendered once
    // We use console.debug to bypass our logging library which hides some log levels in prod builds
    console.debug("App rendered");
  }, []);
  return <>{props.children}</>;
}

export type MainParams = {
  dataSources?: IDataSourceFactory[];
  extraProviders?: JSX.Element[];
  rootElement?: JSX.Element;
};

export async function main(getParams: () => Promise<MainParams> = async () => ({})): Promise<void> {
  log.debug("initializing");

  window.onerror = (...args) => {
    console.error(...args);
  };

  if (typeof process.env.SENTRY_DSN === "string") {
    log.info("initializing Sentry");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: (integrations) => {
        return (
          integrations
            // Remove the default breadbrumbs integration - it does not accurately track breadcrumbs and
            // creates more noise than benefit
            .filter((integration) => integration.name !== "Breadcrumbs")
            .concat([
              // location changes as a result of non-navigation interactions such as seeking
              Sentry.browserTracingIntegration({ instrumentNavigation: false }),
            ])
        );
      },
      tracesSampleRate: 1.0,
    });

    setReportErrorHandler((error) => {
      Sentry.captureException(error);
    });
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    throw new Error("missing #root element");
  }

  const canRender = canRenderApp();

  if (!canRender) {
    // eslint-disable-next-line react/no-deprecated
    ReactDOM.render(
      <StrictMode>
        <LogAfterRender>
          <CssBaseline />
        </LogAfterRender>
      </StrictMode>,
      rootEl,
    );
    return;
  }

  // Use an async import to delay loading the majority of studio-base code until the CompatibilityBanner
  // can be displayed.
  const { installDevtoolsFormatters, overwriteFetch, waitForFonts, initI18n, StudioApp } =
    await import("@foxglove/studio-base");
  installDevtoolsFormatters();
  overwriteFetch();
  // consider moving waitForFonts into App to display an app loading screen
  await waitForFonts();
  await initI18n();

  const { WebRoot } = await import("./WebRoot");
  const params = await getParams();
  const rootElement = params.rootElement ?? (
    <WebRoot extraProviders={params.extraProviders} dataSources={params.dataSources}>
      <StudioApp />
    </WebRoot>
  );

  // eslint-disable-next-line react/no-deprecated
  ReactDOM.render(
    <StrictMode>
      <LogAfterRender>
        {rootElement}
      </LogAfterRender>
    </StrictMode>,
    rootEl,
  );
}
