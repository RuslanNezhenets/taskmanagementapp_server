function [coef1, coef2] = calculateCoefficients(y_max, y_min, z_max, z_min)
    coef1 = y_max - y_min + 1;
    coef2 = ((z_max - z_min) * coef1) + 1;
end