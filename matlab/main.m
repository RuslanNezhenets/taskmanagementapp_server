function [result, fixedResult, w, fitness] = main(D, t, r, const_w, lb, ub)
    nvars = length(t);

    if ~isempty(const_w)
        lb = [lb, const_w];
        ub = [sum(t) * ones(1, nvars), const_w];
    else
        lb = [lb, ones(1, max(r))];
        ub = [ub, nvars * ones(1, max(r))];
    end

    tempI = @(v, i, j)I(v(1:nvars), i, j, t, r);

    options = optimoptions( ...
        @ga, ...
        'MaxGenerations', nvars * 200, ...
        'MaxStallGenerations', nvars * 10, ...
        'PopulationSize', nvars * 30, ...
        'CreationFcn', 'gacreationlinearfeasible', ...
        'PlotFcn', @gaplotbestf, ...
        'Display', 'diagnose', ...
        'FunctionTolerance', 1e-8, ...
        'CrossoverFcn', 'crossoverscattered', ...
        'MutationFcn', 'mutationpower', ...
        'SelectionFcn', 'selectiontournament', ...
        'UseParallel', false ...
        );

    trueConstraints = @(v)constraints(v(1:nvars), v(nvars+1:end), D, t, r, tempI);

    [coef1, coef2] = calculateCoefficients(t);

    rng("shuffle", "twister");
    [v, ~] = ga( ...
        @(v)objective(v(1:nvars), v(nvars+1:end), coef1, coef2), ...
        length(lb), ...
        [], [], [], [], ...
        lb, ...
        ub, ...
        trueConstraints, ...
        1:length(lb), ...
        options ...
        );

    x = v(1:nvars);
    w = v(nvars + 1:end);

    fixedResult = processing(x, w, t, trueConstraints);

    result = x;
    fitness = objective(x, w, coef1, coef2)
end
