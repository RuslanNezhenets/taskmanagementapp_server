function [coef1, coef2] = calculateCoefficients(t)
    % Calculate coef1
    total_sum = sum(t);
    order1 = floor(log10(abs(total_sum))) + 1;
    coef1 = 10^order1;

    % Calculate coef2
    sorted_numbers = sort(t, 'descend');
    cumulative_sum_arr = cumsum(sorted_numbers);
    max_fitness = sum(cumulative_sum_arr) + coef1 * max(cumulative_sum_arr);
    order2 = floor(log10(abs(max_fitness))) + 1;
    coef2 = 10^order2;
end