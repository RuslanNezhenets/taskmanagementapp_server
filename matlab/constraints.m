function [c, ceq] = constraints(x, w, D, t, r, I)
    n = length(x);
    con1 = zeros(n^2, 1);

    for k = 1:n
        for p = 1:n
            temp = x(p)*D(k,p) - (x(k) - t(k));
            con1((k - 1)*n + p) = temp;
        end
    end

    con2 = zeros(n, 1);
    for i = 1:n
        temp_sum = 0;
        % arr = [];
        for j = 1:n
            tempI = I(x,i,j);
            temp_sum = temp_sum + tempI;
        end
        con2(i) = temp_sum - w(r(i));
    end

    c = [con1; con2];
   
    ceq = [];
end