  it("does not tell MiniMax Code users to click a missing import button", async () => {
    renderWithQueryClient(
      <ProviderList
        providers={{}}
        currentProviderId=""
        appId="mcode"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    await screen.findByText("mcode.empty.title");
    expect(screen.getByText("mcode.empty.description")).toBeInTheDocument();
    expect(
      screen.queryByText("provider.noProvidersDescription"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "provider.importCurrent" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "provider.addProvider" }),
    ).toBeInTheDocument();
  it("moves a provider to the top via the right-click menu", async () => {
    const providerA = createProvider({ id: "a", name: "A", sortIndex: 0 });
    const providerB = createProvider({ id: "b", name: "B", sortIndex: 1 });
    const providerC = createProvider({ id: "c", name: "C", sortIndex: 2 });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerA, providerB, providerC],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ a: providerA, b: providerB, c: providerC }}
        currentProviderId="a"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    // 卡片层 div（SortableProviderCard）承载 onContextMenu；对它右键
    fireEvent.contextMenu(screen.getByTestId("provider-card-c"), {
      clientX: 100,
      clientY: 100,
    });

    const menu = await screen.findByText(/一键置顶|provider.quickMoveTop/);
    fireEvent.click(menu);

    await waitFor(() => {
      expect(updateSortOrderMock).toHaveBeenCalledWith(
        [
          { id: "c", sortIndex: 0 },
          { id: "a", sortIndex: 1 },
          { id: "b", sortIndex: 2 },
        ],
        "claude",
      );
    });
    expect(updateTrayMenuMock).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("moves a provider to the bottom via the right-click menu", async () => {
    const providerA = createProvider({ id: "a", name: "A", sortIndex: 0 });
    const providerB = createProvider({ id: "b", name: "B", sortIndex: 1 });
    const providerC = createProvider({ id: "c", name: "C", sortIndex: 2 });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerA, providerB, providerC],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ a: providerA, b: providerB, c: providerC }}
        currentProviderId="a"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByTestId("provider-card-a"), {
      clientX: 50,
      clientY: 50,
    });
    fireEvent.click(
      await screen.findByText(/一键置底|provider.quickMoveBottom/),
    );

    await waitFor(() => {
      expect(updateSortOrderMock).toHaveBeenCalledWith(
        [
          { id: "b", sortIndex: 0 },
          { id: "c", sortIndex: 1 },
          { id: "a", sortIndex: 2 },
        ],
        "claude",
      );
    });
  });

  it("does not call updateSortOrder when moving an already-top provider to top", async () => {
    const providerA = createProvider({ id: "a", name: "A", sortIndex: 0 });
    const providerB = createProvider({ id: "b", name: "B", sortIndex: 1 });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerA, providerB],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ a: providerA, b: providerB }}
        currentProviderId="a"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByTestId("provider-card-a"), {
      clientX: 10,
      clientY: 10,
    });
    fireEvent.click(await screen.findByText(/一键置顶|provider.quickMoveTop/));

    await waitFor(() => {
      expect(toastMock.info).toHaveBeenCalled();
    });
    expect(updateSortOrderMock).not.toHaveBeenCalled();
  });

  it("does not call updateSortOrder when moving an already-bottom provider to bottom", async () => {
    const providerA = createProvider({ id: "a", name: "A", sortIndex: 0 });
    const providerB = createProvider({ id: "b", name: "B", sortIndex: 1 });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerA, providerB],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ a: providerA, b: providerB }}
        currentProviderId="a"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByTestId("provider-card-b"), {
      clientX: 10,
      clientY: 10,
    });
    fireEvent.click(
      await screen.findByText(/一键置底|provider.quickMoveBottom/),
    );

    await waitFor(() => {
      expect(toastMock.info).toHaveBeenCalled();
    });
    expect(updateSortOrderMock).not.toHaveBeenCalled();
  });

  it("closes the context menu on outside pointerdown", async () => {
    const providerA = createProvider({ id: "a", name: "A", sortIndex: 0 });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerA],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ a: providerA }}
        currentProviderId="a"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    fireEvent.contextMenu(screen.getByTestId("provider-card-a"), {
      clientX: 10,
      clientY: 10,
    });
    const menuText = /一键置顶|provider.quickMoveTop/;
    expect(await screen.findByText(menuText)).toBeInTheDocument();

    fireEvent.pointerDown(window);
    await waitFor(() => {
      expect(screen.queryByText(menuText)).not.toBeInTheDocument();
    });
  });
});
