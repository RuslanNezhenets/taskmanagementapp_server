function [result, fixedResult, w, fitness] = main(D, t, r, const_w, lb_, ub_)
    nvars = length(t);

    if ~isempty(const_w)
        lb = [lb_, const_w];
        ub = [sum(t) * ones(1, nvars), const_w];
    else
        lb = [lb_, ones(1, max(r))];
        ub = [ub_, nvars * ones(1, max(r))];
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

    min_x = sum(lb_);
    sorted_numbers = sort(t, 'descend');
    cumulative_sum_arr = cumsum(sorted_numbers);
    max_x = sum(cumulative_sum_arr);
    min_y = max(lb_);
    max_y = max(cumulative_sum_arr);
    min_z = max(r);
    max_z = length(t);

    disp([min_x, max_x])
    disp([min_y, max_y])
    disp([min_z, max_z])

    [coef1, coef2] = calculateCoefficients(max_y, min_y, max_z, min_z);

    disp([coef1, coef2])

    rng("shuffle", "twister");
    [v, ~] = ga( ...
        @(v)objective(v(1:nvars), v(nvars+1:end), coef1, coef2, ...
            min_x, max_x, min_y, max_y, min_z, max_z), ...
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

    % fixedResult = processing(x, w, t, trueConstraints);
    fixedResult = x;

    result = x;
    fitness = objective(x, w, coef1, coef2, min_x, max_x, min_y, max_y, min_z, max_z);
end
