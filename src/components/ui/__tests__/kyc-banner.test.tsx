import React from "react";
import { render, screen } from "@testing-library/react";
import KYCBanner from "../kyc-banner";

describe("KYCBanner", () => {
  it("renders pending status correctly", () => {
    render(<KYCBanner status="PENDING" />);

    expect(screen.getByText("Account Under Review")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your account is being processed. You will be notified soon as your documentation has been approved or disapproved."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });

  it("renders approved status correctly", () => {
    render(<KYCBanner status="APPROVED" />);

    expect(screen.getByText("Account Approved")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Congratulations! Your account has been approved and you can now access all features."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders rejected status correctly", () => {
    render(<KYCBanner status="REJECTED" />);

    expect(screen.getByText("Account Rejected")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your account verification was rejected. Please contact support for more information."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("shows dismiss button when showDismiss is true", () => {
    const onDismiss = jest.fn();
    render(
      <KYCBanner status="PENDING" onDismiss={onDismiss} showDismiss={true} />
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not show dismiss button when showDismiss is false", () => {
    render(<KYCBanner status="PENDING" showDismiss={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
